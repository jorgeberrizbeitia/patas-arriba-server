const express = require("express");
const User = require("../models/User.model");
const { isOrganizerOrAdmin } = require("../middleware/auth.middleware");
const validateMongoIdFormat = require("../utils/validateMongoIdFormat");
const router = express.Router();

// GET "/api/user" - Returns a list of all users (only public info) (for organizer or admin purposes)
router.get("/", isOrganizerOrAdmin, async (req, res, next) => {

  try {
    
    const userList = await User.find().select("username fullName role icon iconColor").sort({createdAt: -1})
    //* fullName added so admin/organizer can search by fullName
    res.status(200).json(userList)

  } catch (error) {
    next(error)
  }

})

// GET "/api/user/own" - Returns logged user information details 
router.get("/own", async (req, res, next) => {

  try {
    
    const ownUserDetails = await User.findById(req.payload._id).select("email username fullName phoneCode phoneNumber role icon iconColor createdAt")
    res.status(200).json(ownUserDetails)

  } catch (error) {
    next(error)
  }

})

// GET "/api/user/:userId" - Returns a specific user information details (only public info)
router.get("/:userId", async (req, res, next) => {

  const { userId } = req.params

  const isUserIdValid = validateMongoIdFormat(userId, res, "Id de usuario en formato incorrecto")
  if (!isUserIdValid) return

  try {
    
    const userDetails = await User.findById(userId).select("username fullName phoneCode phoneNumber role icon iconColor createdAt")
    res.status(200).json(userDetails)

  } catch (error) {
    next(error)
  }

})

// PATCH "/api/user/icon" - Updates logged user icon & icon color
router.patch("/icon", async (req, res, next) => {
  //* url in camelCase to allow for dynamic component in frontend

  const { icon, iconColor } = req.body

  if (!icon || !iconColor ) {
    res.status(400).json({ errorMessage: "Los campos deben estar llenos" });
    return;
  }

  //todo iconColor color validation
  //todo icon enum validation

  try {
    
    const updatedUser = await User.findByIdAndUpdate(req.payload._id, { icon, iconColor }, {new: true})

    if (!updatedUser) {
      res.status(400).send({errorMessage: "No hay usuarios con ese id"})
      return;
    }

    const userClone = JSON.parse(JSON.stringify(updatedUser))
    delete userClone.password // password removed for security

    res.status(202).json(userClone) 

  } catch (error) {
    next(error)
  }

})

// PATCH "/api/user/fullName" - Updates logged user fullName
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

    const userClone = JSON.parse(JSON.stringify(updatedUser))
    delete userClone.password // password removed for security
    
    res.status(202).json(userClone) 

  } catch (error) {
    next(error)
  }

})

// PATCH "/api/user/password" - Updates logged user password
//todo

// PATCH "/api/user/username" - Updates logged user username
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

    const userClone = JSON.parse(JSON.stringify(updatedUser))
    delete userClone.password // password removed for security
    
    res.status(202).json(userClone) 

  } catch (error) {
    next(error)
  }

})

// PATCH "/api/user/phone" - Updates logged user phoneCode & phoneNumber
//todo

// PATCH "/api/user/:userId/user-role-validation" - Updates user role from "pending" to "user" (only organizer or admin)
router.patch("/:userId/user-role-validation", isOrganizerOrAdmin, async (req, res, next) => {

  const { userId } = req.params

  const isUserIdValid = validateMongoIdFormat(userId, res, "Id de usuario en formato incorrecto")
  if (!isUserIdValid) return

  try {
    
    const updatedUser = await User.findByIdAndUpdate(userId, { role: "user" }, {new: true})

    if (!updatedUser) {
      res.status(400).send({errorMessage: "No hay usuarios con ese id"})
      return;
    }

    const userClone = JSON.parse(JSON.stringify(updatedUser))
    delete userClone.password // password removed for security
    
    res.status(202).json(userClone) 

  } catch (error) {
    next(error)
  }

})

// PATCH "/api/user/:userId/user-role/:role" - Updates user role to "user", "organizer" or "blocked" (only admin)
//todo

module.exports = router;