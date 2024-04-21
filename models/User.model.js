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
      maxLength: 20,
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
      required: [true, "Phone Code is required."],
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
      enum: ["pending", "user", "admin", "blocked"],
      default: "pending"
    },
    icon: {
      type: String,
      default: "data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20height='32'%20width='32'%20viewBox='0%200%20512%20512'%3e%3c!--!Font%20Awesome%20Free%206.5.2%20by%20@fontawesome%20-%20https://fontawesome.com%20License%20-%20https://fontawesome.com/license/free%20Copyright%202024%20Fonticons,%20Inc.--%3e%3cpath%20d='M226.5%2092.9c14.3%2042.9-.3%2086.2-32.6%2096.8s-70.1-15.6-84.4-58.5s.3-86.2%2032.6-96.8s70.1%2015.6%2084.4%2058.5zM100.4%20198.6c18.9%2032.4%2014.3%2070.1-10.2%2084.1s-59.7-.9-78.5-33.3S-2.7%20179.3%2021.8%20165.3s59.7%20.9%2078.5%2033.3zM69.2%20401.2C121.6%20259.9%20214.7%20224%20256%20224s134.4%2035.9%20186.8%20177.2c3.6%209.7%205.2%2020.1%205.2%2030.5v1.6c0%2025.8-20.9%2046.7-46.7%2046.7c-11.5%200-22.9-1.4-34-4.2l-88-22c-15.3-3.8-31.3-3.8-46.6%200l-88%2022c-11.1%202.8-22.5%204.2-34%204.2C84.9%20480%2064%20459.1%2064%20433.3v-1.6c0-10.4%201.6-20.8%205.2-30.5zM421.8%20282.7c-24.5-14-29.1-51.7-10.2-84.1s54-47.3%2078.5-33.3s29.1%2051.7%2010.2%2084.1s-54%2047.3-78.5%2033.3zM310.1%20189.7c-32.3-10.6-46.9-53.9-32.6-96.8s52.1-69.1%2084.4-58.5s46.9%2053.9%2032.6%2096.8s-52.1%2069.1-84.4%2058.5z'/%3e%3c/svg%3e"
      // above uses the same data URI scheme fontawesome uses for deploy version
    },
    iconColor: {
      type: String,
      default: "#FFFFFF"
    }
  },
  {
    timestamps: true,
  }
);

const User = model("User", userSchema);

module.exports = User;
