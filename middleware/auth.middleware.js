const jwt = require("jsonwebtoken");

function isAuthenticated(req, res, next) {
  try {
    
    console.log(req.headers);
    const token = req.headers?.authorization?.split(" ")[1];
    const payload = jwt.verify(token, process.env.TOKEN_SECRET);

    req.payload = payload
    next()
  } catch (error) {
    res.status(401).json({ errorMessage: "Token no valido o ha expirado" });
  }
}

function isOrganizerOrAdmin(req, res, next) {
  if (req.payload?.role === "organizer" || req.payload?.role === "admin") {
    next()
  } else {
    res.status(401).json("Acceso solo para organizadores or admin")
  }
}

function isAdmin(req, res, next) {
  if (req.payload?.role === "admin") {
    next()
  } else {
    res.status(401).json("Acceso solo para admin")
  }
}

module.exports = {
  isAuthenticated,
  isOrganizerOrAdmin,
  isAdmin
}
