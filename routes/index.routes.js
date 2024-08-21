const express = require("express");
const router = express.Router();

const { isAuthenticated } = require("../middleware/auth.middleware");

router.get("/", (req, res, next) => {
  res.json("Test route. All good");
});

const authRoutes = require("./auth.routes");
router.use("/auth", authRoutes);

const userRoutes = require("./user.routes");
router.use("/user", isAuthenticated, userRoutes);

const eventRoutes = require("./event.routes");
router.use("/event", isAuthenticated, eventRoutes);

const attendeeRoutes = require("./attendee.routes");
router.use("/attendee", isAuthenticated, attendeeRoutes);

const carGroupRoutes = require("./car-group.routes");
router.use("/car-group", isAuthenticated, carGroupRoutes);

const messageRoutes = require("./message.routes");
router.use("/message", isAuthenticated, messageRoutes);

const pushSubscriptionRoutes = require("./pushsubscription.routes");
router.use("/pushsubscription", isAuthenticated, pushSubscriptionRoutes);

module.exports = router;
