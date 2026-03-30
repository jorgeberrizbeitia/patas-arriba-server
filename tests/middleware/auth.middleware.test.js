import { describe, it, expect, vi, beforeAll } from "vitest";
import jwt from "jsonwebtoken";
import {
  isAuthenticated,
  isOrganizerOrAdmin,
  isAdmin,
} from "../../middleware/auth.middleware.js";

const TOKEN_SECRET = process.env.TOKEN_SECRET;

function mockReqResNext(overrides = {}) {
  const req = { headers: {}, ...overrides };
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  const next = vi.fn();
  return { req, res, next };
}

describe("isAuthenticated", () => {
  it("calls next() with a valid token", () => {
    const token = jwt.sign(
      { _id: "123", role: "user" },
      TOKEN_SECRET,
      { expiresIn: "1h" }
    );
    const { req, res, next } = mockReqResNext({
      headers: { authorization: `Bearer ${token}` },
    });

    isAuthenticated(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.payload._id).toBe("123");
    expect(req.payload.role).toBe("user");
  });

  it("returns 401 with no token", () => {
    const { req, res, next } = mockReqResNext();

    isAuthenticated(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 with an invalid token", () => {
    const { req, res, next } = mockReqResNext({
      headers: { authorization: "Bearer invalid-token" },
    });

    isAuthenticated(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 with an expired token", () => {
    const token = jwt.sign(
      { _id: "123", role: "user" },
      TOKEN_SECRET,
      { expiresIn: "-1s" }
    );
    const { req, res, next } = mockReqResNext({
      headers: { authorization: `Bearer ${token}` },
    });

    isAuthenticated(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });
});

describe("isOrganizerOrAdmin", () => {
  it("calls next() for organizer", () => {
    const { req, res, next } = mockReqResNext();
    req.payload = { role: "organizer" };

    isOrganizerOrAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("calls next() for admin", () => {
    const { req, res, next } = mockReqResNext();
    req.payload = { role: "admin" };

    isOrganizerOrAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("returns 401 for regular user", () => {
    const { req, res, next } = mockReqResNext();
    req.payload = { role: "user" };

    isOrganizerOrAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });
});

describe("isAdmin", () => {
  it("calls next() for admin", () => {
    const { req, res, next } = mockReqResNext();
    req.payload = { role: "admin" };

    isAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("returns 401 for organizer", () => {
    const { req, res, next } = mockReqResNext();
    req.payload = { role: "organizer" };

    isAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });
});