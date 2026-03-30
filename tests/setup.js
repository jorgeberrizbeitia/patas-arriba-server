import dotenv from "dotenv";
import { afterAll } from "vitest";
import mongoose from "mongoose";

dotenv.config();

afterAll(async () => {
  await mongoose.connection.close();
});