const express = require("express");
const router = express.Router();

const CarGroup = require("../models/CarGroup.model")
const Event = require("../models/Event.model")

const validateMongoIdFormat = require("../utils/validateMongoIdFormat")
const validateRequiredFields = require("../utils/validateRequiredFields")
const validateDateFormat = require("../utils/validateDateFormat")

// POST "/api/car-group/:eventId" - Create a new car group from an event id
router.post("/:eventId", async (req, res, next) => {

  const { eventId } = req.params
  const { pickupCoordinates, pickupLocation, pickupTime, roomAvailable } = req.body

  const areRequiredFieldsValid = validateRequiredFields(res, roomAvailable, pickupLocation, pickupTime)
  if (!areRequiredFieldsValid) return

  const isEventIdValid = validateMongoIdFormat(eventId, res, "Id de evento en formato incorrecto")
  if (!isEventIdValid) return

  try {

    const foundEvent = await Event.findById(eventId)
    if (!foundEvent.participants.includes(req.payload._id)) {
      res.status(400).json({errorMessage: "No puedes crear grupo de coche porque no perteneces a este evento"})
      return
    }

    const foundCarGroup = await CarGroup.findOne({$and: [{event: eventId}, {owner: req.payload._id}]})
    if (foundCarGroup) {
      res.status(400).json({errorMessage: "Grupo de coche ya creado por este usuario para este evento"})
      return
    }

    //todo no puedes crear grupo de coche si estas en otro
    
    await CarGroup.create({ 
      pickupCoordinates,
      pickupLocation,
      pickupTime,
      roomAvailable,
      owner: req.payload._id,
      event: eventId
    })

    //todo maybe receive createdCar, validate 500 with problems creating car

    res.sendStatus(202)

  } catch (error) {
    next(error)
  }

})

// GET "/api/car-group/list/:eventId" - Returns a list of all car groups of that event
router.get("/list/:eventId", async (req, res, next) => {

  const { eventId } = req.params

  const isEventIdValid = validateMongoIdFormat(eventId, res, "Id de evento en formato incorrecto")
  if (!isEventIdValid) return

  try {
    
    const carGroupsByEvent = await CarGroup
      .find({ event: eventId })
      .select("pickupLocation pickupCoordinates pickupTime roomAvailable members owner")
      .populate("owner", "username fullName icon iconColor")
    res.status(200).json(carGroupsByEvent)

  } catch (error) {
    next(error)
  }

})

// GET "/api/car-group/:carGroupId" - Returns details of a car group you are in of this event
router.get("/:carGroupId", async (req, res, next) => {

  const { carGroupId } = req.params

  const isCarGroupIdValid = validateMongoIdFormat(carGroupId, res, "Id de evento en formato incorrecto")
  if (!isCarGroupIdValid) return

  try {

    const carGroupDetails = await CarGroup
      .findById(carGroupId)
      .populate("owner", "username fullName phoneCode phoneNumber icon iconColor")
      .populate("members", "username fullName phoneCode phoneNumber icon iconColor")
      .populate({
        path: "messages",
        model: "Message",
        populate: {
          path: "sender",
          model: "User",
          select: "username fullName icon iconColor"
        }
      })

    if (!carGroupDetails) {
      res.status(400).json({errorMessage: "Grupo de coche no existe por ese id"})
      return
    }

    const isUserInCarGroup = carGroupDetails.members.some((member) => member._id == req.payload._id)
   
    if (carGroupDetails.owner._id != req.payload._id && !isUserInCarGroup) {
      res.status(400).json({errorMessage: "No perteneces a este grupo de coche como dueño o como miembro"})
      return
    }

    res.status(200).json(carGroupDetails)

  } catch (error) {
    next(error)
  }

})

// PUT "/api/car-group/:carGroupId" - Update details of the car group (creator only)
router.put("/:carGroupId", async (req, res, next) => {

  const { carGroupId } = req.params
  const { pickupCoordinates, pickupLocation, pickupTime, roomAvailable } = req.body

  const isCarGroupIdValid = validateMongoIdFormat(carGroupId, res, "Id de evento en formato incorrecto")
  if (!isCarGroupIdValid) return

  const areRequiredFieldsValid = validateRequiredFields(res, pickupLocation, roomAvailable, pickupTime)
  if (!areRequiredFieldsValid) return

  
  try {
    
    const foundCarGroup = await CarGroup.findById(carGroupId)
    
    if (!foundCarGroup) {
      res.status(400).json({ errorMessage: "No hay grupos de coche con ese id" })
      return
    }
    
    if (foundCarGroup.owner != req.payload._id) {
      res.status(401).json({errorMessage: "No puedes editar este grupo de coche porque no eres el dueño"})
      return
    }
    
    //todo no puedes disminuir plazas disponibles si ya estan llenas

    await CarGroup.findByIdAndUpdate(carGroupId, { 
      pickupCoordinates,
      pickupLocation,
      pickupTime,
      roomAvailable,
    })

    res.sendStatus(202)
  } catch(error) {
    next(error)
  }

})

// PATCH "/api/car-group/:carGroupId/join" - Join a car group (only if you don't already joined or created one for this event)
router.patch("/:carGroupId/join", async (req, res, next) => {

  const { carGroupId } = req.params

  const isCarGroupIdValid = validateMongoIdFormat(carGroupId, res, "Id de grupo de coche en formato incorrecto")
  if (!isCarGroupIdValid) return

  try {

    const carGroup = await CarGroup.findById(carGroupId)

    if (!carGroup) {
      res.status(400).json({ errorMessage: "No hay grupos de coche con ese id" })
      return
    }

    if (carGroup.members.length >= carGroup.roomAvailable ) {
      res.status(400).json({ errorMessage: "No hay espacio disponible en este grupo de coche" })
      return
    }

    if (carGroup.owner._id == req.payload._id) {
      res.status(400).json({ errorMessage: "No te puedes unir como miembro al grupo de coche que has creado" })
      return
    }

    const event = await Event.findById(carGroup.event)

    if (!event || event.isCancelled) {
      res.status(400).json({ errorMessage: "No te puedes unir al grupo de coche porque el evento de ese grupo de coche no existe o ha sido cancelado" })
      return
    }

    if (!event.participants.includes(req.payload._id)) {
      res.status(400).json({ errorMessage: "No te puedes unir al grupo de coche porque no te has unido al evento" })
      return
    }

    const carGroupAlreadyJoined = await CarGroup.findOne({$and: [{event: event._id}, {members: {$in: req.payload._id}}]})
    if (carGroupAlreadyJoined) {
      res.status(400).json({ errorMessage: "No te puedes unir al grupo de coche porque ya estas en un grupo de coche para el mismo evento." })
      return
    }

    const updatedCarGroup = await CarGroup.findByIdAndUpdate(carGroupId, { $addToSet: { members: req.payload._id } })

    if (!updatedCarGroup) {
      res.status(500).json({ errorMessage: "Hubo un problema al agregar el usuario al grupo de coche" })
      return
    }

    res.sendStatus(202)
    
  } catch (error) {
    next(error)
  }

})

// PATCH "/api/car-group/:carGroupId/leave" - Leave a car group
router.patch("/:carGroupId/leave", async (req, res, next) => {

  const { carGroupId } = req.params

  const isCarGroupIdValid = validateMongoIdFormat(carGroupId, res, "Id de grupo de coche en formato incorrecto")
  if (!isCarGroupIdValid) return

  try {

    const updatedCarGroup = await CarGroup.findByIdAndUpdate(carGroupId, { $pull: { members: req.payload._id } })

    if (!updatedCarGroup) {
      res.status(400).json({ errorMessage: "No hay eventos con ese id o hubo un problema al remover al usuario del grupo de coche" })
      return
    }

    //todo enviar mensaje de que alguien se fue o crear notificacion

    res.sendStatus(202)
    
  } catch (error) {
    next(error)
  }

})

// DELETE "/api/car-group/:carGroupId" - Attemps to delete a car-group
router.delete("/:carGroupId", async (req, res, next) => {

  //*IMPORTANT: car groups will not have a status to preserve data, instead, notifications will handle if a car-group a user was in was deleted

  const { carGroupId } = req.params

  const isCarGroupIdValid = validateMongoIdFormat(carGroupId, res, "Id de evento en formato incorrecto")
  if (!isCarGroupIdValid) return

  try {
    
    const foundCarGroup = await CarGroup.findById(carGroupId)

    if (!foundCarGroup) {
      res.status(400).json({ errorMessage: "No hay grupos de coche con ese id" })
      return
    }

    if (foundCarGroup.owner != req.payload._id) {
      res.status(401).json({errorMessage: "No puedes borrar este grupo de coche porque no eres el dueño"})
      return
    }

    await CarGroup.findByIdAndDelete(carGroupId)

    //todo borrar todos los mensajes de ese grupo de coche
    //todo notificacion a usuarios si se borra el grupo de coche aqui

    res.sendStatus(202)

  } catch (error) {
    next(error)
  }

})

module.exports = router;