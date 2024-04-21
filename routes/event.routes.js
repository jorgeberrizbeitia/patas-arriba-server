const express = require("express");
const router = express.Router();
const { isAdmin } = require("../middleware/auth.middleware");

const Event = require("../models/Event.model");
const CarGroup = require("../models/CarGroup.model");
const Message = require("../models/Message.model");
const Attendee = require("../models/Attendee.model");

const validateMongoIdFormat = require("../utils/validateMongoIdFormat")
const validateDateFormat = require("../utils/validateDateFormat")
const validateRequiredFields = require("../utils/validateRequiredFields");

// POST "/api/event" - Creates a new event (admin only)
router.post("/", isAdmin, async (req, res, next) => {

  const { title, category, description, location, date, time, hasCarOrganization, hasTaskAssignments} = req.body

  //todo validate can't create events more than 2 months in advance due to messages and car groups only lasting 90 days.

  const areRequiredFieldsValid = validateRequiredFields(res, title, location, category, date, time)
  if (!areRequiredFieldsValid) return

  const dateFormatted = `${date}T${time}:00` //! convert this in frontend, then use new Date(here)

  let isDateFormatValid = validateDateFormat(res, dateFormatted, "Formato de fecha invalido")
  if (!isDateFormatValid) return

  // todo see how to create validation function for this
  if (title.length > 50 || title.length > 50) {
    res.status(400).json({ errorMessage: "Los campos de titulo y lugar no deben tener más de 50 caracteres" });
    return;
  }

  const allowedCategoryFormats = ["recogida", "protectora", "mercadillo" , "otro"]
  if (!allowedCategoryFormats.includes(category)) {
    res.status(400).json({ errorMessage: "Valor de categoria incorrecto" });
    return;
  }

  try {
    
    const createdEvent = await Event.create({
      title, 
      category, 
      description, 
      location, 
      date: new Date(dateFormatted), 
      // time, 
      hasCarOrganization, 
      hasTaskAssignments,
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

  const query = {}

  if (req.query.upcoming) {
    //* when only upcoming are shown
    const today = new Date()
    today.setHours(0, 0, 0, 0); // Set the time to the beginning of the day
    query.date = { $gte: today }
  }

  try {
    
    let allEvents = await Event
      .find(query)
      .select("title category location date time status")
      .sort({date: -1})

    const allEventIds = allEvents.map((event) => event._id)

    const allAttendees = await Attendee.find({event: { $in: allEventIds }})

    allEvents = JSON.parse(JSON.stringify(allEvents)) //* cloning before adding attendees array

    allEvents.forEach((event) => {
      //* for every event filters the correct attendees and only adds userId (no other info is needed)
      event.attendees = allAttendees.filter((attendee) => attendee.event == event._id).map((attendee) => attendee.user)
    })

    //todo find a way to request above structured data on a single database request

    res.status(200).json(allEvents)

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
    
    let eventDetails = await Event
    .findById(eventId)
    .populate("owner", "username fullName icon iconColor")
    
    if (!eventDetails) {
      res.status(400).send({errorMessage: "No hay eventos con ese id"})
      return;
    }

    const attendees = await Attendee
    .find({event: eventDetails._id})
    .populate("user", "username fullName icon iconColor")

    const carGroups = await CarGroup
    .find({event: eventDetails._id})
    .select("roomAvailable passengers owner")

    const messages = await Message
    .find({relatedType: "event", relatedId: eventDetails._id})
    .populate("sender", "username fullName icon iconColor")
    
    eventDetails = JSON.parse(JSON.stringify(eventDetails))

    res.status(200).json({eventDetails, attendees, carGroups, messages})
    
  } catch (error) {
    next(error)
  }

})

// PUT "/api/event/:eventId" - Updates event title, location and type (admin only)
router.put("/:eventId", isAdmin, async (req, res, next) => {

  const { eventId } = req.params
  const { title, category, description, location, date, time, hasCarOrganization, hasTaskAssignments} = req.body

  
  const isEventIdValid = validateMongoIdFormat(eventId, res, "Id de evento en formato incorrecto")
  if (!isEventIdValid) return
  
  const areRequiredFieldsValid = validateRequiredFields(res, title, category, location, date, time)
  //todo check validateRequiredFields doesn't accept booleans (hasCarOrganization, hasTaskAssignments)
  if (!areRequiredFieldsValid) return

  const dateFormatted = `${date}T${time}:00` //! convert this in frontend, then use new Date(here)
  
  let isDateFormatValid = validateDateFormat(res, dateFormatted, "Formato de fecha invalido")
  if (!isDateFormatValid) return

  if (title.length > 50 || title.length > 50) {
    res.status(400).json({ errorMessage: "Los campos de titulo y ubicación no deben tener más de 50 caracteres" });
    return;
  }

  const allowedCategoryFormats = ["recogida", "protectora", "mercadillo" , "otro"]
  if (!allowedCategoryFormats.includes(category)) {
    res.status(400).json({ errorMessage: "Valor de categoria incorrecto" });
    return;
  }

  try {
    
    const updatedEvent = await Event.findByIdAndUpdate(eventId, {
      title, 
      category, 
      description, 
      location, 
      date: new Date(dateFormatted), 
      // time, 
      hasCarOrganization, 
      hasTaskAssignments
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

  const allowedStatusFormats = ["open", "closed", "cancelled"]
  if (!allowedStatusFormats.includes(status)) {
    res.status(400).json({ errorMessage: "Valor de status incorrecto" });
    return;
  }

  try {

    let updatedEvent = await Event.findByIdAndUpdate(eventId, { status })

    //todo decidir si eliminar todos los attendees si el evento es cancelado

    if (!updatedEvent) {
      res.status(400).json({ errorMessage: "No hay eventos con ese id" })
      return
    }

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