const express = require("express");
const router = express.Router();
const { isAdmin } = require("../middleware/auth.middleware");

const Event = require("../models/Event.model");
const CarGroup = require("../models/CarGroup.model");
const Message = require("../models/Message.model");

const validateMongoIdFormat = require("../utils/validateMongoIdFormat")
const validateDateFormat = require("../utils/validateDateFormat")
const validateRequiredFields = require("../utils/validateRequiredFields")

// POST "/api/event" - Creates a new event (admin only)
router.post("/", isAdmin, async (req, res, next) => {

  const { title, location, category, date, time } = req.body

  const areRequiredFieldsValid = validateRequiredFields(res, title, location, category, date, time)
  if (!areRequiredFieldsValid) return

  let isDateFormatValid = validateDateFormat(res, date, "Formato de fecha invalido")
  if (!isDateFormatValid) return

  // todo see how to create validation function for this
  if (title.length > 50 || title.length > 50) {
    res.status(400).json({ errorMessage: "Los campos de titulo y lugar no deben tener más de 50 caracteres" });
    return;
  }

  const allowedCategoryFormats = ["no-car-group", "car-group"]
  if (!allowedCategoryFormats.includes(category)) {
    res.status(400).json({ errorMessage: "Valor de categoria incorrecto" });
    return;
  }

  try {
    
    const createdEvent = await Event.create({
      title,
      location,
      category,
      date,
      time,
      creator: req.payload._id
    })

    if (!createdEvent) {
      res.status(500).json({ errorMessage: "Hubo un problema creando el evento" })
      return
    }

    res.status(201).json({ createdEventId: createdEvent?._id })

  } catch (error) {
    next(error)
  }

})

// GET "/api/event" - Returns a list of all events (simplified data)
router.get("/", async (req, res, next) => {

  try {
    
    const allEvents = await Event
      .find()
      .select("title date location participants status")
      .sort({date: -1})

    res.status(200).json(allEvents)

  } catch (error) {
    next(error)
  }

})

// GET "/api/event/upcoming" - Returns a list of all upcoming events sorted (simplified data)
router.get("/upcoming", async (req, res, next) => {

  const today = new Date()
  today.setHours(0, 0, 0, 0); // Set the time to the beginning of the day

  try {
    
    const upcomingEvents = await Event
      .find({ date: { $gte: today } })
      .select("title date location participants status")
      .sort( { date: -1 } )

    res.status(200).json(upcomingEvents)

  } catch (error) {
    next(error)
  }

})

// GET /api/event/:eventId - Returns details of an event (all data including carGroups, to see if the user has joined one)
router.get("/:eventId", async (req, res, next) => {

  const { eventId } = req.params

  const isEventIdValid = validateMongoIdFormat(eventId, res, "Id de evento en formato incorrecto")
  if (!isEventIdValid) return

  try {
    
    const eventDetails = await Event.findById(eventId)
    //.populate("creator", "name") //! check if needed by client
    .populate("participants", "username fullName")
    .populate({
      path: "messages",
      model: "Message",
      populate: {
        path: "sender",
        model: "User",
        select: "username fullName role"
      }
    })

    if (!eventDetails) {
      res.status(400).send({errorMessage: "No hay eventos con ese id"})
      return;
    }

    // ! check question for Jaime to see if unjoined users can see all chats & participants
    res.status(200).json(eventDetails)
    

  } catch (error) {
    next(error)
  }

})

// PUT "/api/event/:eventId" - Updates event title, location and type (admin only)
router.put("/:eventId", isAdmin, async (req, res, next) => {

  const { eventId } = req.params
  const { title, location, category, date, time } = req.body
  console.log(req.body)

  const isEventIdValid = validateMongoIdFormat(eventId, res, "Id de evento en formato incorrecto")
  if (!isEventIdValid) return
  
  const areRequiredFieldsValid = validateRequiredFields(res, title, location, category, date, time)
  if (!areRequiredFieldsValid) return

  let isDateFormatValid = validateDateFormat(res, date, "Formato de fecha invalido")
  if (!isDateFormatValid) return

  if (title.length > 50 || title.length > 50) {
    res.status(400).json({ errorMessage: "Los campos de titulo y ubicación no deben tener más de 50 caracteres" });
    return;
  }

  const allowedCategoryFormats = ["no-car-group", "car-group"]
  if (!allowedCategoryFormats.includes(category)) {
    res.status(400).json({ errorMessage: "Valor de categoria incorrecto" });
    return;
  }

  try {
    
    const updatedEvent = await Event.findByIdAndUpdate(eventId, {
      title,
      location,
      category,
      date,
      time
    })

    if (!updatedEvent) {
      res.status(400).json({ errorMessage: "No hay eventos con ese id" })
      return
    }

    res.status(202).json({ updatedEventId: updatedEvent?._id })

  } catch (error) {
    next(error)
  }

})

// PATCH "/api/event/:eventId" - Updates event status (admin only)
router.patch("/:eventId/status", isAdmin, async (req, res, next) => {

  const { eventId } = req.params
  const { status } = req.body

  const isEventIdValid = validateMongoIdFormat(eventId, res, "Id de evento en formato incorrecto")
  if (!isEventIdValid) return

  try {

    const updatedEvent = await Event.findByIdAndUpdate(eventId, {status})

    if (!updatedEvent) {
      res.status(400).json({ errorMessage: "No hay eventos con ese id" })
      return
    }

    res.sendStatus(202)
    
  } catch (error) {
    next(error)
  }

})

// PATCH "/api/event/:userId/join" - Add logged userId to participants array of event
router.patch("/:eventId/join", async (req, res, next) => {

  const { eventId } = req.params

  const isEventIdValid = validateMongoIdFormat(eventId, res, "Id de evento en formato incorrecto")
  if (!isEventIdValid) return

  try {

    //todo you can only join upcoming events and not canceled or closed

    const updatedEvent = await Event.findByIdAndUpdate(eventId, { $addToSet: { participants: req.payload._id } })

    if (!updatedEvent) {
      res.status(400).json({ errorMessage: "No hay eventos con ese id" })
      return
    }

    res.sendStatus(202)
    
  } catch (error) {
    next(error)
  }
})

// PATCH "/api/event/:userId/leave" - Remove logged userId to participants array of event. Also leave from any existing car group.
router.patch("/:eventId/leave", async (req, res, next) => {

  const { eventId } = req.params

  const isEventIdValid = validateMongoIdFormat(eventId, res, "Id de evento en formato incorrecto")
  if (!isEventIdValid) return

  try {

    const updatedEvent = await Event.findByIdAndUpdate(eventId, { $pull: { participants: req.payload._id } })

    if (!updatedEvent) {
      res.status(400).json({ errorMessage: "No hay eventos con ese id" })
      return
    }

    // if user is in a car group, it will also cause it to leave.
    await CarGroup.findOneAndUpdate({$and: [{event: updatedEvent._id}, {members: {$in: req.payload._id}}]}, {$pull: {members: req.payload._id}})

    //if uses has car group created, it will also delete it.
    await CarGroup.findOneAndDelete({$and: [{event: updatedEvent._id}, {owner: req.payload._id}]})
    //? should I delete or cancel it?

    res.sendStatus(202)
    
  } catch (error) {
    next(error)
  }

})

// DELETE "/api/event" - Creates a new event (admin only) also deletes all car groups and messages from this event
router.delete("/:eventId", isAdmin, async (req, res, next) => {

  const { eventId } = req.params

  const isEventIdValid = validateMongoIdFormat(eventId, res, "Id de evento en formato incorrecto")
  if (!isEventIdValid) return

  try {
    
    const deletedEvent = await Event.findByIdAndDelete(eventId)

    if (!deletedEvent) {
      res.status(400).json({ errorMessage: "No hay eventos con ese id" })
      return
    }

    await CarGroup.deleteMany({ event: deletedEvent._id }) // delete all car groups from that event
    await Message.deleteMany({ _id: { $in: deletedEvent.messages } }) // delete all messages from that event

    // ! note to test above when creating messages and carGroups

    res.sendStatus(202)

  } catch (error) {
    next(error)
  }

})

module.exports = router;