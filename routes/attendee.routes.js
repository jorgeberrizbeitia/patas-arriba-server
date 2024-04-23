const express = require("express");
const router = express.Router();

const Event = require("../models/Event.model");
const Attendee = require("../models/Attendee.model");
const CarGroup = require("../models/CarGroup.model");

const validateMongoIdFormat = require("../utils/validateMongoIdFormat");
const { isAdmin } = require("../middleware/auth.middleware");

// POST "/api/attendee/:userId" - create attendee document for logged user and event
router.post("/:eventId", async (req, res, next) => {

  const { eventId } = req.params

  const isEventIdValid = validateMongoIdFormat(eventId, res, "Id de evento en formato incorrecto")
  if (!isEventIdValid) return

  try {

    const foundEvent = await Event.findById(eventId)

    const today = new Date()
    const eventDate = new Date(foundEvent.date)

    if (eventDate < today) {
      //* event is in the past
      res.status(400).json({ errorMessage: "No puedes unirte a eventos pasados" })
      return
    }

    if (!foundEvent) {
      res.status(400).json({ errorMessage: "No hay eventos con ese id" })
      return
    }

    if (foundEvent.status === "closed") {
      res.status(400).json({ errorMessage: "No puedes unirte al evento porque está cerrado" })
      return
    }

    if (foundEvent.status === "cancelled") {
      res.status(400).json({ errorMessage: "No puedes unirte al evento porque está cancelado" })
      return
    }

    const attendeeDoc = await Attendee.findOne({user: req.payload._id, event: eventId})
    if (attendeeDoc) {
      res.status(400).json({ errorMessage: "Ya estas unido a este evento" })
      return
    }

    const newAttendee = await Attendee.create({
      user: req.payload._id,
      event: eventId,
    })

    const attendee = await Attendee.findById(newAttendee._id).populate("user", "username fullName icon iconColor") 
    //* above so the FE doesn't need to make another request for updated data

    res.status(201).send(attendee)
    
  } catch (error) {
    next(error)
  }
})

router.get("/:eventId", async (req, res, next) => {

  const { eventId } = req.params

  const isEventIdValid = validateMongoIdFormat(eventId, res, "Id de evento en formato incorrecto")
  if (!isEventIdValid) return

  try {
    
    const attendees = await Attendee
    .find({event: eventId})
    .populate("user", "username fullName icon iconColor")

    res.status(200).send(attendees)

  } catch (error) {
    next(error)
  }

})

// DELETE "/api/attendee/:attendeeId" - delete or update attendee document for logged user and event. Also updates car group.
router.delete("/:eventId", async (req, res, next) => {

  const { eventId } = req.params

  const isEventIdValid = validateMongoIdFormat(eventId, res, "Id de evento en formato incorrecto")
  if (!isEventIdValid) return

  try {

    const foundEvent = await Event.findById(eventId)
    //todo check if this is neccesary

    if (!foundEvent) {
      res.status(400).json({ errorMessage: "No hay eventos con ese Id" })
      return
    }

    if (foundEvent.status === "cancelled") {
      res.status(400).json({ errorMessage: "Este evento ha sido cancelado, no es necesario salir del evento" })
      return
    }
    
    if (foundEvent.status === "closed") {
      res.status(400).json({ errorMessage: "Este evento ya ha sido cerrado, si no puedes asistir indicalo al organizador del evento" })
      return
    }

    //* only user that joined the event will be able to delete the attendee document
    const deletedAttendee = await Attendee.findOneAndDelete({event: eventId, user: req.payload._id})

    if (!deletedAttendee) {
      res.status(400).json({ errorMessage: "No puedes salir del evento porque no te has unido o no tienes permiso" })
      return
    }

    //* if the user created a car group, it will be deleted (only if event was still open)
    await CarGroup.findOneAndDelete({$and: [{event: eventId}, {owner: req.payload._id}]})
    //todo notification to car group users if any
    
    //* if user is in a car group, it will also cause it to leave (any status)
    await CarGroup.findOneAndUpdate({$and: [{event: eventId}, {passengers: {$in: req.payload._id}}]}, {$pull: {passengers: req.payload._id}})
    
    res.sendStatus(202)
    
  } catch (error) {
    next(error)
  }
})

//PATCH "/api/attendee/:attendeeId/status" - admin updates status of attendee
router.patch("/:attendeeId/attendance", isAdmin, async (req, res, next) => {

  const { attendeeId } = req.params
  const { attendance } = req.body

  const allowedAttendanceFormats = ["pending", "show", "no-show", "excused"]
  if (!allowedAttendanceFormats.includes(attendance)) {
    res.status(400).json({ errorMessage: "Valor de status incorrecto" });
    return;
  }

  //todo if event is open do not allow change in status. check if worth doing a second DB call.

  const isIdValid = validateMongoIdFormat(attendeeId, res, "Id de participación en formato incorrecto")
  if (!isIdValid) return

  //* if the event was closed it will set attendee status to cancelled (only if event is closed)
  const updatedAttendee = await Attendee.findByIdAndUpdate(attendeeId, { attendance })

  if (!updatedAttendee) {
    res.status(400).json({ errorMessage: "Participación de usuario no encontrada para este evento" })
    return
  }

  res.sendStatus(202)

})

//PATCH "/api/attendee/:attendeeId/task" - admin updates task of attendee
router.patch("/:attendeeId/task", isAdmin, async (req, res, next) => {

  const { attendeeId } = req.params
  const { task } = req.body

  //todo if event is open do not allow change in status. check if worth doing a second DB call.

  const isIdValid = validateMongoIdFormat(attendeeId, res, "Id de participación en formato incorrecto")
  if (!isIdValid) return

  const updatedAttendee = await Attendee.findByIdAndUpdate(attendeeId, { task })

  if (!updatedAttendee) {
    res.status(400).json({ errorMessage: "Participación de usuario no encontrada para este evento" })
    return
  }

  res.sendStatus(202)

})

//todo GET "/api/attendee" - sends list of previously joined events to logged user
router.get("/", async (req, res, next) => {})

//todo GET "/api/attendee/:userId" - sends list of previously joined events for single user (admin only)
router.get("/:userId", async (req, res, next) => {})

module.exports = router;