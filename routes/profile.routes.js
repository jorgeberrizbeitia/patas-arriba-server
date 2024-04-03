const express = require("express");
const User = require("../models/User.model");
const { isAdmin } = require("../middleware/auth.middleware");
const validateMongoIdFormat = require("../utils/validateMongoIdFormat");
const router = express.Router();

// GET "/api/profile" - Returns a list of all users (only public info) (for admin purposes)
router.get("/", isAdmin, async (req, res, next) => {

  try {
    
    const userList = await User.find().select("username role").sort({createdAt: -1})
    res.status(200).json(userList)

  } catch (error) {
    next(error)
  }

})

// GET "/api/profile/own" - Returns logged user information details 
router.get("/own", async (req, res, next) => {

  try {
    
    const ownProfile = await User.findById(req.payload._id).select("email username fullName phoneCode phoneNumber profileIcon profileIconColor createdAt")
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
    
    const userProfile = await User.findById(userId).select("email username fullName phoneCode phoneNumber role createdAt")
    res.status(200).json(userProfile)

  } catch (error) {
    next(error)
  }

})

// PATCH "/api/profile/profileIcon" - Updates logged user profile pic
router.patch("/profileIcon", async (req, res, next) => {
  //* url in camelCase to allow for dynamic component in frontend

  const { profileIcon, profileIconColor } = req.body

  if (!profileIcon || !profileIconColor ) {
    res.status(400).json({ errorMessage: "Los campos deben estar llenos" });
    return;
  }

  //todo iconColor color validation
  //todo icon enum validation

  try {
    
    const updatedUser = await User.findByIdAndUpdate(req.payload._id, { profileIcon, profileIconColor }, {new: true})

    if (!updatedUser) {
      res.status(400).send({errorMessage: "No hay usuarios con ese id"})
      return;
    }

    res.status(202).json(updatedUser)
    //todo remove password from updatedUser in all patch

  } catch (error) {
    next(error)
  }

})

// PATCH "/api/profile/fullName" - Updates logged user fullName
router.patch("/fullName", async (req, res, next) => {
  //* url in camelCase to allow for dynamic component in frontend

  const { fullName } = req.body

  if (!fullName ) {
    res.status(400).json({ errorMessage: "El campo debe estar lleno" });
    return;
  }

  const fullNameRegex = /^[a-zA-ZÀ-ÖØ-öØ-ÿ\s']{3,30}$/;
  if (!fullNameRegex.test(fullName)) {
    res.status(400).json({ errorMessage: "Solo letras, espacios y de 3 a 30 caracteres" });
    return;
  }

  try {
    
    const updatedUser = await User.findByIdAndUpdate(req.payload._id, { fullName }, {new: true})

    if (!updatedUser) {
      res.status(400).send({errorMessage: "No hay usuarios con ese id"})
      return;
    }

    res.status(202).json(updatedUser)

  } catch (error) {
    next(error)
  }

})

// PATCH "/api/profile/password" - Updates logged user password

// PATCH "/api/profile/username" - Updates logged user username
router.patch("/username", async (req, res, next) => {

  const { username } = req.body

  if (!username ) {
    res.status(400).json({ errorMessage: "El campo debe estar lleno" });
    return;
  }

  const usernameRegex = /^[^\s]{3,15}$/;
  if (!usernameRegex.test(username)) {
    res.status(400).json({ errorMessage: "No debe tener espacios y de 3 a 15 characteres" });
    return;
  }

  try {

    const foundUserByUsername = await User.findOne({$and: [{ _id: {$ne: req.payload._id} }, { username }]});
    if (foundUserByUsername) {
      res.status(400).json({ errorField: "username", errorMessage: "Ya existe un usuario con ese nombre de usuario" });
      return;
    }
    
    const updatedUser = await User.findByIdAndUpdate(req.payload._id, { username }, {new: true})

    if (!updatedUser) {
      res.status(400).send({errorMessage: "No hay usuarios con ese id"})
      return;
    }

    res.status(202).json(updatedUser)

  } catch (error) {
    next(error)
  }

})

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