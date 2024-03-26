const express = require("express");
const router = express.Router();

const Message = require("../models/Message.model")

// POST "/api/messages/:placementId/:type" - Creates a new message to either an event or a car group

// DELETE "/api/message/:messageId" - Deletes a message (only owner or admin)

module.exports = router;