const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/User.model");

const { isAuthenticated } = require("../middleware/auth.middleware.js");
const cleanString = require("../utils/cleanString.js")

const saltRounds = 10;

// POST /api/auth/signup - Validates user data and creates user document in the DB
router.post("/signup", async (req, res, next) => {
  const { email, username, password, fullName, phoneCode, phoneNumber } = req.body;

  //todo check to use validateRequiredFields here

  if (!email || !username|| !password || !fullName || !phoneCode || !phoneNumber ) {
    res.status(400).json({ errorMessage: "Todos los campos deben estar llenos" });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ errorMessage: "Correo electrónico con formato incorrecto" });
    return;
  }

  const usernameRegex = /^[^\s]{3,20}$/;
  if (!usernameRegex.test(username)) {
    res.status(400).json({ errorMessage: "Nombre de Usuario no debe tener espacios y de 3 a 20 characteres" });
    return;
  }
  
  const fullNameRegex = /^[a-zA-ZÀ-ÖØ-öØ-ÿ\s']{3,30}$/;
  if (!fullNameRegex.test(fullName)) {
    res.status(400).json({ errorMessage: "Nombre Completo debe tener solo letras, espacios y de 3 a 30 caracteres" });
    return;
  }

  const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
  if (!passwordRegex.test(password)) {
    res.status(400).json({ errorMessage: "Contraseña debe tener al menos 6 caractéres, un numero, una minúscula y una mayúscula" });
    return;
  }

  const phoneNumberRegex = /^[0-9]{7,15}$/;
  if (!phoneNumberRegex.test(phoneNumber)) {
    res.status(400).json({ errorMessage: "Número telefónico solo debe contener dígitos numericos y de 7 a 15 dígitos" });
    return;
  }

  try {

    const foundUserByEmail = await User.findOne({ email });
    if (foundUserByEmail) {
      res.status(400).json({ errorField: "email", errorMessage: "Ya existe un usuario con ese correo electronico" });
      return;
    }

    const foundUserByUsername = await User.findOne({ username });
    if (foundUserByUsername) {
      res.status(400).json({ errorField: "username", errorMessage: "Ya existe un usuario con ese nombre de usuario" });
      return;
    }

    //* changed to username
    // const foundUserByFullName = await User.findOne({ $and: [{firstName: cleanString(firstName)}, {lastName: cleanString(lastName)}]});
    // if (foundUserByFullName) {
    //   res.status(400).json({ errorField: "fullName", errorMessage: "Ya existe un usuario con el mismo nombre y apellido" });
    //   return;
    // }

    const foundUserByPhoneNumber = await User.findOne({ $and: [{phoneCode}, {phoneNumber}]});
    if (foundUserByPhoneNumber) {
      res.status(400).json({ errorField: "phoneNumber", errorMessage: "Ya existe un usuario con ese número telefonico" });
      return;
    }

    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    await User.create({ 
      email, 
      username,
      password: hashedPassword,
      fullName: cleanString(fullName), // removes double spaces and converts to lowercase
      phoneCode, 
      phoneNumber,
      role: "pending"
    });

    res.sendStatus(201);
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login - Authenticates user credentials (email/username and password) and returns a JWT
router.post("/login", async (req, res, next) => {
  const { credential, password } = req.body;

  if (!credential || !password) {
    res.status(400).json({ errorMessage: "Todos los campos deben estar llenos" });
    return;
  }
  
  try {
    
    const foundUser = await User.findOne({$or: [{ email: credential}, {username: credential }]})

    if (!foundUser) {
      res.status(401).json({ errorField: "credential", errorMessage: "Usuario no encontrado con ese correo electrónico o nombre de usuario" });
      return;
    }

    const passwordCorrect = await bcrypt.compare(password, foundUser.password);
    if (!passwordCorrect) {
      res.status(401).json({ errorField: "password", errorMessage: "Contraseña no valida" });
      return;
    }

    if (foundUser.role === "pending") {
      res.status(401).json({ errorField: "role", errorMessage: "Usuario sin permisos para entrar, contacta a un fundador de Patas Arriba para habilitar tu usuario" });
      return;
    }
    //todo telefono de acceso para solicitar permiso?

    const payload = { 
      _id: foundUser._id, 
      email: foundUser.email,
      role: foundUser.role 
    };

    const authToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
      algorithm: "HS256",
      expiresIn: "7w",
    });

    res.status(200).json({ authToken: authToken });

  } catch (error) {
    next(error)
  }

});

// GET /api/auth/verify - Used to verify JWT stored on the client
router.get("/verify", isAuthenticated, (req, res, next) => {
  res.status(200).json({payload: req.payload});
});

module.exports = router;
