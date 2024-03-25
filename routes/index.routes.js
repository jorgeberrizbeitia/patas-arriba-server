const express = require("express");
const router = express.Router();

router.get("/", (req, res, next) => {
  res.json("Test route. All good");
});

const authRoutes = require("./auth.routes");
router.use("/auth", authRoutes);

module.exports = router;
