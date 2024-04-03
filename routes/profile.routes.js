const express = require("express");
const User = require("../models/User.model");
const { isAdmin } = require("../middleware/auth.middleware");
const validateMongoIdFormat = require("../utils/validateMongoIdFormat");
const router = express.Router();

// GET "/api/profile" - Returns a list of all users (only public info) (for admin purposes)
router.get("/", isAdmin, async (req, res, next) => {

  try {
    
    const userList = await User.find().select("username role profilePic").sort({createdAt: -1})
    res.status(200).json(userList)

  } catch (error) {
    next(error)
  }

})

// GET "/api/profile/own" - Returns logged user information details 
router.get("/own", async (req, res, next) => {

  try {
    
    const ownProfile = await User.findById(req.payload._id).select("email username fullName phoneCode phoneNumber profilePic createdAt")
    res.status(200).json(ownProfile)

  } catch (error) {
    next(error)
  }

})

// GET "/api/profile/:userId" - Returns a specific user information details (only public info)
router.get("/:userId", async (req, res, next) => {

  const { userId } = req.params

  const isUserIdValid = validateMongoIdFormat(userId, res, "Id de usuario en formato incorrecto")
  if (!isUserIdValid) return

  try {
    
    const userProfile = await User.findById(userId).select("email username fullName phoneCode phoneNumber profilePic role createdAt")
    res.status(200).json(userProfile)

  } catch (error) {
    next(error)
  }

})

// PATCH "/api/profile/profile-pic" - Updates logged user profile pic

// PATCH "/api/profile/full-name" - Updates logged user fullName

// PATCH "/api/profile/password" - Updates logged user password

// PATCH "/api/profile/username" - Updates logged user username

// PATCH "/api/profile/phone" - Updates logged user phoneCode & phoneNumber

// PATCH "/api/profile/:userId/user-role-validation" - Updates user role from "pending" to "user" (for admin purposes)
router.patch("/:userId/user-role-validation", isAdmin, async (req, res, next) => {

  const { userId } = req.params

  const isUserIdValid = validateMongoIdFormat(userId, res, "Id de usuario en formato incorrecto")
  if (!isUserIdValid) return

  try {
    
    const user = await User.findByIdAndUpdate(userId, { role: "user" }, {new: true})

    if (!user) {
      res.status(400).send({errorMessage: "No hay usuarios con ese id"})
      return;
    }

    res.status(202).json(user)

  } catch (error) {
    next(error)
  }

})

module.exports = router;