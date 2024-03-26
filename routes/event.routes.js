const express = require("express");
const router = express.Router();
const { isAdmin } = require("../middleware/auth.middleware");
const Event = require("../models/Event.model")

// GET "/api/event" - Returns a list of all events (simplified data)
router.get("/", (req, res, next) => {})

// GET "/api/event/upcoming" - Returns a list of all upcoming events (simplified data)
router.get("/upcoming", (req, res, next) => {})

// GET /api/event/:eventId - Returns details of an event (all data including carGroups, to see if the user has joined one)
router.get("/:eventId", (req, res, next) => {})

// POST "/api/event" - Creates a new event (admin only)
router.post("/", isAdmin, async (req, res, next) => {

  const { title, location, category } = req.body
  
  try {
    
    await Event.create({
      title,
      location,
      category,
      creator: req.payload._id
    })

    res.sendStatus(201)

  } catch (error) {
    next(error)
  }

})

// DELETE "/api/event" - Creates a new event (admin only) also deletes all car groups and messages
router.delete("/", (req, res, next) => {})

// PATCH "/api/event/:eventId" - Updates event isCancelled (admin only)
router.patch("/", isAdmin, (req, res, next) => {})

// PUT "/api/event/:eventId" - Updates event title, location and type (admin only)
router.put("/:eventId", (req, res, next) => {})

// PATCH "/api/event/:userId/join" - Add userId to participants array of event
router.patch("/:userId/join", (req, res, next) => {})

// PATCH "/api/event/:userId/leave" - Remove userId to participants array of event. Also leave from any existing car group.
router.patch("/:userId/leave", (req, res, next) => {})

module.exports = router;