const express = require("express");
const User = require("../models/User.model");
const { isAdmin } = require("../middleware/auth.middleware");
const router = express.Router();

// GET "/api/profile" - Returns a list of all users (only public info) (for admin purposes)
router.get("/", isAdmin, async (req, res, next) => {

  try {
    
    const userList = await User.find().select("email firstName lastName phoneCode phoneNumber role profilePic")
    res.status(200).json(userList)

  } catch (error) {
    next(error)
  }

})

// GET "/api/profile/own" - Returns logged user information details 
router.get("/own", async (req, res, next) => {

  try {
    
    const ownProfile = await User.findById(req.payload._id).select("email firstName lastName phoneCode phoneNumber profilePic")
    res.status(200).json(ownProfile)

  } catch (error) {
    next(error)
  }

})

// GET "/api/profile/:userId" - Returns a specific user information details (only public info)
router.get("/:userId", async (req, res, next) => {

  try {
    
    const userProfile = await User.findById(req.params.userId).select("firstName lastName phoneCode phoneNumber profilePic role")
    res.status(200).json(userProfile)

  } catch (error) {
    next(error)
  }

})

// PATCH "/api/profile/profile-pic" - Updates logged user profile pic

// PATCH "/api/profile/full-name" - Updates logged user firstName and lastName

// PATCH "/api/profile/password" - Updates logged user password

// PATCH "/api/profile/phone" - Updates logged user phoneCode & phoneNumber

// PATCH "/api/profile/:userId/user-role-validation" - Updates user role from "pending" to "user" (for admin purposes)

module.exports = router;