const { Schema, model } = require("mongoose");

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      required: [true, "Username is required."],
      unique: true,
      lowercase: true,
      trim: true,
      minLength: 3,
      maxLength: 15,
    },
    password: {
      type: String,
      required: [true, "Password is required."],
    },
    fullName: {
      type: String,
      required: [true, "Full Name is required."],
      lowercase: true,
      trim: true,
      minLength: 3,
      maxLength: 30,
    },
    phoneCode: {
      type: Number,
      required: [true, "Phone code is required."],
      default: 34,
      max: 999
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone Number is required."],
      trim: true,
      maxLength: 30
    },
    role: {
      type: String,
      enum: ["pending", "user", "admin"],
      default: "pending"
    },
    profilePic: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

const User = model("User", userSchema);

module.exports = User;
