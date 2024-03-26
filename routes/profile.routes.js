const express = require("express");
const router = express.Router();

// GET "/api/profile" - Returns a list of all users (only public info) (for admin purposes)

// GET "/api/profile/own" - Returns logged user information details 

// GET "/api/profile/:userId" - Returns a specific user information details (only public info)

// PATCH "/api/profile/profile-pic" - Updates logged user profile pic

// PATCH "/api/profile/full-name" - Updates logged user firstName and lastName

// PATCH "/api/profile/password" - Updates logged user password

// PATCH "/api/profile/phone" - Updates logged user phoneCode & phoneNumber

// PATCH "/api/profile/:userId/user-role-validation" - Updates user role from "pending" to "user" (for admin purposes)

module.exports = router;