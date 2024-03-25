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
    //! confirmar como debe ser username o si debe existir
    // username: {
    //   type: String,
    //   required: [true, "Name is required."],
    //   unique: true,
    //   lowercase: true,
    //   trim: true,
    // },
    password: {
      type: String,
      required: [true, "Password is required."],
    },
    firstName: {
      type: String,
      required: true,
      maxLength: 30,
      trim: true,
      lowercase: true,
    },
    lastName: {
      type: String,
      required: true,
      maxLength: 30,
      trim: true,
      lowercase: true,
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
