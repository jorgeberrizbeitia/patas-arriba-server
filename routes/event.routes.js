const express = require("express");
const router = express.Router();

// GET "/api/event" - Returns a list of all events (simplified data)

// GET "/api/event/upcoming" - Returns a list of all upcoming events (simplified data)

// GET /api/event/:eventId - Returns details of an event (all data including carGroups, to see if the user has joined one)

// POST "/api/event" - Creates a new event (admin only)

// DELETE "/api/event" - Creates a new event (admin only) also deletes all car groups and messages

// PATCH "/api/event/:eventId/" - Updates event isCancelled (admin only)

// PUT "/api/event/:eventId/" - Updates event title, location and type (admin only)

// PATCH "/api/event/join/:userId" - Add userId to participants array of event

// PATCH "/api/event/leave/:userId" - Remove userId to participants array of event. Also leave from any existing car group.

module.exports = router;