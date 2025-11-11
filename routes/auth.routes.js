const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
// const nodemailer = require("nodemailer") //! changed for mailersend
const axios = require("axios")

const User = require("../models/User.model");

const { isAuthenticated } = require("../middleware/auth.middleware.js");
const cleanString = require("../utils/cleanString.js")

const saltRounds = 12;


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
    res.status(400).json({ errorMessage: "Contraseña debe tener al menos 6 caractéres, un número, una minúscula y una mayúscula" });
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

    const authToken = jwt.sign(
      payload, 
      process.env.TOKEN_SECRET, 
      {
        algorithm: "HS256",
        expiresIn: "14d",
      }
    );

    res.status(200).json({ authToken: authToken });

  } catch (error) {
    next(error)
  }

});

// GET /api/auth/verify - Used to verify JWT stored on the client
router.get("/verify", isAuthenticated, (req, res, next) => {
  res.status(200).json({payload: req.payload});
});

// POST "/api/auth/password-forget" - Used for users that forget password and want to recover
router.post("/password-forget", async (req, res, next) => {

  const { email } = req.body

  try {

    const foundUser = await User.findOne({ email: email });

    if (!foundUser) {
      res.status(400).send({ errorMessage: "Usuario no encontrado con ese correo electrónico" });
      return;
    }

    // Generate a temporary JWT token for the user that contains the user's id
    const token = jwt.sign(
      { _id: foundUser._id }, 
      process.env.TOKEN_SECRET, 
      {expiresIn: "15m",}
    );

    const resetUrl = `${process.env.ORIGIN}/password-reset/${token}`;

    const htmlContent = `
      <h1>Restablece tu contraseña</h1>
      <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>Este enlace expirará en 15 minutos.</p>
    `;

    await axios.post("https://api.mailersend.com/v1/email", {
      from: { email: process.env.EMAIL },
      to: [ { email: email } ],
      subject: "Restablecer contraseña",
      html: htmlContent,
    }, {
      headers: {
        Authorization: `Bearer ${process.env.MAILERSEND_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    res.status(200).send({ message: "Correo de recuperación de contraseña enviado" });


    //! changed for mailersend
    // const transporter = nodemailer.createTransport({
    //   service: "gmail",
    //   auth: {
    //     user: process.env.EMAIL,
    //     pass: process.env.EMAIL_PASSWORD,
    //   },
    // });

    // const mailOptions = {
    //   from: process.env.EMAIL,
    //   to: email,
    //   subject: "Restablecer contraseña",
    //   html: `
    //     <h1>Restablece tu contraseña</h1>
    //     <p>Haz clic en el enlace de abajo para restablecer la contraseña de la página de eventos de Patas Arriba:</p>
    //     <a href="${process.env.ORIGIN}/password-reset/${token}">${process.env.ORIGIN}/password-reset/${token}</a>
    //     <p>Este enlace expirará en 15 minutos.</p>
    //     <p>Si no fuiste tú quien pidió restablecer la contraseña, ignora este correo.</p>
    //   `,
    // };

    // // Send the email with password recovery instructions and the temporary token
    // transporter.sendMail(mailOptions, (err, info) => {
    //   if (err) {
    //     next(err)
    //     return;
    //   }
    //   res.status(200).send({ message: "Correo de recuperación de contraseña enviado" });
    // });

  } catch (err) {
    next(err)
  }
})

// POST "/api/auth/password-reset" - Used for password reset after recovery access above. Validates temporary token.
router.post("/password-reset", isAuthenticated, async (req, res, next) => {

  const { password } = req.body

  try {

    const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
    if (!passwordRegex.test(password)) {
      res.status(400).json({ errorMessage: "Contraseña debe tener al menos 6 caractéres, un número, una minúscula y una mayúscula" });
      return;
    }

    const foundUser = await User.findById(req.payload._id);

    if (!foundUser) {
      res.status(400).send({ errorMessage: "Usuario no encontrado con ese correo electrónico" });
      return;
    }
    
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    foundUser.password = hashedPassword
    await foundUser.save();

    res.status(200).send({ message: "contraseña actualizada" });
  } catch (err) {
    next(err)
  }

})

module.exports = router;
