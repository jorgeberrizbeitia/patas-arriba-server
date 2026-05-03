// Boots an ephemeral in-process MongoDB before any test file loads, so the
// server's `require("./db")` chain in app.js connects to a fresh database
// instead of a developer's local Mongo. Each `vitest run` starts and stops
// its own mongod; nothing to provision, nothing leaks between runs.
//
// Why top-level await rather than beforeAll: vitest evaluates setup files
// first, then test modules (whose top-level `import app from "../../app.js"`
// triggers db/index.js, which calls mongoose.connect with whatever
// MONGODB_URI is set at that moment). Hooks run later. So MONGODB_URI must
// be the memory-server URI before the test file's imports execute —
// beforeAll fires too late and the first request comes back ECONNREFUSED.
//
// dotenv runs first to pick up developer-local values (e.g. PUSH_* keys for
// future tests), then we overwrite MONGODB_URI unconditionally. The `||=`
// defaults below do not stomp anything a developer set in .env.

import dotenv from "dotenv";
import { afterAll } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

dotenv.config();

const mongo = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongo.getUri();

process.env.TOKEN_SECRET ||= "test-token-secret";
process.env.ORIGIN ||= "http://localhost:5173";

afterAll(async () => {
  await mongoose.connection.close();
  await mongo.stop();
});
