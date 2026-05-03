// Integration tests for the attendee route, focused on the attendance default.
//
// What this file pins down: a brand-new sign-up created via
// POST /api/attendee/:eventId comes back with attendance "show". The default
// used to be "pending"; flipping it (see specs/attendance-default.md) means
// the organizer only marks exceptions instead of confirming everyone, which
// is the workflow change driving issue #2.
//
// Why an integration test and not a pure schema unit test: the contract that
// matters to the client is the HTTP response. A unit test on the Mongoose
// schema would also pass if a future handler started passing an explicit
// attendance value into Attendee.create() — that would silently override the
// default and the unit test wouldn't notice. Hitting the route end-to-end
// covers both the schema default and the handler's reliance on it.
//
// Test scaffolding mirrors auth.routes.test.js: timestamp-suffixed unique
// records, afterAll cleanup keyed off the suffix so parallel runs don't step
// on each other.

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../app.js";

const User = mongoose.model("User");
const Event = mongoose.model("Event");
const Attendee = mongoose.model("Attendee");

const suffix = `${Date.now()}`.slice(-6);
const testUser = {
  email: `att-${suffix}@test.com`,
  username: `att${suffix}`,
  fullName: "Attendee Test User",
  phoneCode: 34,
  phoneNumber: `6${suffix}111`,
  password: "ValidPass1",
};

let authToken;
let eventId;

beforeAll(async () => {
  // Sign up + activate the test user (signup creates with role "pending"; the
  // login flow rejects pending users, so we promote to "user" the same way
  // auth.routes.test.js does).
  await request(app).post("/api/auth/signup").send(testUser);
  await User.findOneAndUpdate({ email: testUser.email }, { role: "user" });

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ credential: testUser.email, password: testUser.password });
  authToken = loginRes.body.authToken;

  // A future-dated event so the "no past events" guard in the route doesn't
  // reject the sign-up.
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const event = await Event.create({
    title: `Attendance default test event ${suffix}`,
    location: "Test location",
    date: futureDate,
    category: "otro",
    status: "open",
  });
  eventId = event._id.toString();
});

afterAll(async () => {
  await Attendee.deleteMany({ event: eventId });
  await Event.deleteOne({ _id: eventId });
  await User.deleteMany({ email: new RegExp(`att-${suffix}`) });
});

describe("POST /api/attendee/:eventId — attendance default", () => {
  it("creates a new attendee with attendance set to 'show'", async () => {
    const res = await request(app)
      .post(`/api/attendee/${eventId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(201);
    expect(res.body.attendance).toBe("show");
  });
});
