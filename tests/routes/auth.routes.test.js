import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../app.js";

const User = mongoose.model("User");

const suffix = `${Date.now()}`.slice(-6);
const testUser = {
  email: `at-${suffix}@test.com`,
  username: `at${suffix}`,
  fullName: "Auth Test User",
  phoneCode: 34,
  phoneNumber: `6${suffix}000`,
  password: "ValidPass1",
};

afterAll(async () => {
  await User.deleteMany({ email: new RegExp(`at-${suffix}`) });
});

describe("POST /api/auth/signup", () => {
  it("creates a new user with valid data", async () => {
    const res = await request(app).post("/api/auth/signup").send(testUser);

    expect(res.status).toBe(201);
  });

  it("rejects signup with missing fields", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ email: "a@b.com" });

    expect(res.status).toBe(400);
    expect(res.body.errorMessage).toContain("campos");
  });

  it("rejects signup with invalid email format", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...testUser, email: "not-an-email", username: "unique123" });

    expect(res.status).toBe(400);
    expect(res.body.errorMessage).toContain("formato");
  });

  it("rejects signup with weak password", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...testUser, email: "weak@test.com", username: "weakpw1", password: "weak" });

    expect(res.status).toBe(400);
    expect(res.body.errorMessage).toContain("Contraseña");
  });

  it("rejects duplicate email", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...testUser, username: "differentuser1", phoneNumber: "1234567" });

    expect(res.status).toBe(400);
    expect(res.body.errorField).toBe("email");
  });

  it("rejects duplicate username", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...testUser, email: "different@test.com", phoneNumber: "7654321" });

    expect(res.status).toBe(400);
    expect(res.body.errorField).toBe("username");
  });
});

describe("POST /api/auth/login", () => {
  beforeAll(async () => {
    // Activate the test user so they can log in
    await User.findOneAndUpdate(
      { email: testUser.email },
      { role: "user" }
    );
  });

  it("logs in with valid email and password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ credential: testUser.email, password: testUser.password });

    expect(res.status).toBe(200);
    expect(res.body.authToken).toBeDefined();
  });

  it("logs in with valid username and password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ credential: testUser.username, password: testUser.password });

    expect(res.status).toBe(200);
    expect(res.body.authToken).toBeDefined();
  });

  it("rejects login with wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ credential: testUser.email, password: "WrongPass1" });

    expect(res.status).toBe(401);
    expect(res.body.errorField).toBe("password");
  });

  it("rejects login with non-existent user", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ credential: "nonexistent@test.com", password: "Pass1234" });

    expect(res.status).toBe(401);
    expect(res.body.errorField).toBe("credential");
  });

  it("rejects login with missing fields", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ credential: testUser.email });

    expect(res.status).toBe(400);
  });

  it("rejects login for pending user", async () => {
    // Create a pending user
    const pendingId = Date.now() + 1;
    await request(app).post("/api/auth/signup").send({
      email: `pending-${pendingId}@test.com`,
      username: `pending${pendingId}`,
      fullName: "Pending User",
      phoneCode: 34,
      phoneNumber: `${pendingId}`.slice(-9),
      password: "ValidPass1",
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ credential: `pending-${pendingId}@test.com`, password: "ValidPass1" });

    expect(res.status).toBe(401);
    expect(res.body.errorField).toBe("role");

    // Cleanup
    await User.deleteOne({ email: `pending-${pendingId}@test.com` });
  });
});

describe("GET /api/auth/verify", () => {
  let authToken;

  beforeAll(async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ credential: testUser.email, password: testUser.password });
    authToken = res.body.authToken;
  });

  it("verifies a valid token", async () => {
    const res = await request(app)
      .get("/api/auth/verify")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.payload._id).toBeDefined();
    expect(res.body.payload.email).toBe(testUser.email);
  });

  it("rejects an invalid token", async () => {
    const res = await request(app)
      .get("/api/auth/verify")
      .set("Authorization", "Bearer invalid-token");

    expect(res.status).toBe(401);
  });

  it("rejects a request with no token", async () => {
    const res = await request(app).get("/api/auth/verify");

    expect(res.status).toBe(401);
  });
});