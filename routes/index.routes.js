const express = require("express");
const router = express.Router();

router.get("/", (req, res, next) => {
  res.json("Test route. All good");
});

const authRoutes = require("./auth.routes");
router.use("/auth", authRoutes);

const authRoutes = require("./profile.routes");
router.use("/profile", authRoutes);

const authRoutes = require("./event.routes");
router.use("/event", authRoutes);

const authRoutes = require("./car-group.routes");
router.use("/car-group", authRoutes);

const authRoutes = require("./message.routes");
router.use("/message", authRoutes);

module.exports = router;
