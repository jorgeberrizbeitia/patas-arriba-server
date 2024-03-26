const express = require("express");
const router = express.Router();

const CarGroup = require("../models/CarGroup.model")

// GET "/api/car-group/list/:eventId" - Returns a list of all car groups of that event

// GET "/api/car-group/:carGroup" - Returns details of a car group you are in of this event

// DELETE "/api/car-group/:carGroup" - Returns a list of all car groups of that event

// PATCH "/api/car-group/:carGroup/join" - Join a car group (only if you don't already joined or created one for this event)

// PATCH "/api/car-group/:carGroup/leave" - Leave a car group

// PUT "/api/car-group/:carGroup" - Update details of the car group (creator only)

module.exports = router;