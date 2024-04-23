const express = require("express");
const router = express.Router();

const CarGroup = require("../models/CarGroup.model")
const Event = require("../models/Event.model")
const Attendee = require("../models/Attendee.model")

const validateMongoIdFormat = require("../utils/validateMongoIdFormat")
const validateRequiredFields = require("../utils/validateRequiredFields")
const validateDateFormat = require("../utils/validateDateFormat");
const Message = require("../models/Message.model");

// POST "/api/car-group/:eventId" - Create a new car group from an event id
router.post("/:eventId", async (req, res, next) => {

  const { eventId } = req.params
  const { roomAvailable, pickupLocation, pickupTime, carColor, carBrand } = req.body

  // const areRequiredFieldsValid = validateRequiredFields(res, roomAvailable, pickupLocation, pickupTime, carColor, carBrand)
  // if (!areRequiredFieldsValid) return
  //todo testing without required as to allow users to

  const isEventIdValid = validateMongoIdFormat(eventId, res, "Id de evento en formato incorrecto")
  if (!isEventIdValid) return

  try {

    const foundEvent = await Event.findById(eventId)

    if (!foundEvent) {
      res.status(400).json({errorMessage: "No hay eventos con este id"})
      return
    }

    if (!foundEvent.hasCarOrganization) {
      res.status(400).json({errorMessage: "Este evento no permite organización de coches"})
      return
    }

    const foundAttendee = await Attendee.findOne({event: eventId, user: req.payload._id})
    if (!foundAttendee) {
      res.status(400).json({errorMessage: "No puedes crear grupo de coche porque no perteneces a este evento"})
      return
    }

    const userOwnsCarGroupInEvent = {event: eventId, owner: req.payload._id}
    const userIsInCarGroupInEvent = {event: eventId, passengers: {$in: req.payload._id}}
    const foundCarGroup = await CarGroup.findOne({$or: [userOwnsCarGroupInEvent, userIsInCarGroupInEvent]})
    if (foundCarGroup) {
      res.status(400).json({errorMessage: "No puedes crear grupo de coche porque ya creaste o perteneces a un grupo de coche para este evento"})
      return
    }
  
    const createdCarGroup = await CarGroup.create({ 
      pickupLocation,
      pickupTime,
      roomAvailable,
      carColor,
      carBrand,
      owner: req.payload._id,
      event: eventId
    })

    if (!createdCarGroup) {
      res.status(500).json({errorMessage: "Problema de base de datos creando el grupo de coche"})
      return
    }

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
      .select("owner passengers roomAvailable pickupLocation pickupTime carColor carBrand status")
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
      .populate("passengers", "username fullName phoneCode phoneNumber icon iconColor")
      .populate("event", "title location date time status")
    
    if (!carGroupDetails) {
      res.status(400).json({errorMessage: "Grupo de coche no existe por ese id"})
      return
    }

    const isUserInCarGroup = carGroupDetails.passengers.some((passenger) => passenger._id == req.payload._id)
   
    if (carGroupDetails.owner._id != req.payload._id && !isUserInCarGroup) {
      res.status(400).json({errorMessage: "No perteneces a este grupo de coche como dueño o como miembro"})
      return
    }

    const messages = await Message
    .find({relatedType: "car-group", relatedId: carGroupDetails._id})
    .populate("sender", "username fullName icon iconColor")

    res.status(200).json({carGroupDetails, messages})

  } catch (error) {
    next(error)
  }

})

// PUT "/api/car-group/:carGroupId" - Update details of the car group (creator only)
router.put("/:carGroupId", async (req, res, next) => {

  const { carGroupId } = req.params
  const { pickupLocation, pickupTime, roomAvailable, carColor, carBrand } = req.body

  const isCarGroupIdValid = validateMongoIdFormat(carGroupId, res, "Id de evento en formato incorrecto")
  if (!isCarGroupIdValid) return

  const areRequiredFieldsValid = validateRequiredFields(res, pickupLocation, roomAvailable, pickupTime, carColor, carBrand)
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
    
    const newRoomAvailableWithPassangers = roomAvailable - foundCarGroup.passengers.length

    if (newRoomAvailableWithPassangers < 0) {
      res.status(400).json({errorMessage: "No puedes reducir la cantidad de plazas de coche porque ya estan llenas. Si hay un error, intenta eliminar el grupo de coche, contactar a los pasajeros para que busquen otro coche o contactar al organizador del evento para que te ayude con los cambios."})
      return
    }

    await CarGroup.findByIdAndUpdate(carGroupId, { 
      pickupLocation,
      pickupTime,
      roomAvailable,
      carColor,
      carBrand,
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

    const carGroup = await CarGroup.findById(carGroupId).populate("event")

    if (!carGroup) {
      res.status(400).json({ errorMessage: "No hay grupos de coche con ese id" })
      return
    }

    if (carGroup.isCancelled) {
      res.status(400).json({ errorMessage: "Este Grupo de coche ha sido cancelado" })
      return
    }

    if (carGroup.passengers.length >= carGroup.roomAvailable ) {
      res.status(400).json({ errorMessage: "No hay espacio disponible en este grupo de coche" })
      return
    }

    if (carGroup.owner._id == req.payload._id) {
      res.status(400).json({ errorMessage: "No te puedes unir como pasajero al grupo de coche que has creado" })
      return
    }

    if (carGroup.passengers.includes(req.payload._id)) {
      res.status(400).json({ errorMessage: "Ya te has unido a este grupo de coche" })
      return
    }

    const { event } = carGroup

    if (!event || event.status === "cancelled") {
      res.status(400).json({ errorMessage: "No te puedes unir al grupo de coche porque el evento de ese grupo de coche no existe o ha sido cancelado" })
      return
    }

    const attendee = await Attendee.findOne({ user: req.payload._id, event: event._id })
    if (!attendee) {
      res.status(400).json({ errorMessage: "No te puedes unir al grupo de coche porque no te has unido al evento" })
      return
    }

    const existingCarGroup = await CarGroup.findOne({
      event: event._id,
      $or: [
        { owner: req.payload._id }, // User is the owner
        { passengers: { $in: [req.payload._id] } } // User is a passenger
      ]
    });
    if (existingCarGroup) {
      res.status(400).json({ errorMessage: "No te puedes unir al grupo de coche porque ya estas en un grupo de coche para el mismo evento o tienes uno propio creado" })
      return
    }

    const updatedCarGroup = await CarGroup.findByIdAndUpdate(carGroupId, { $addToSet: { passengers: req.payload._id } })

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

    const updatedCarGroup = await CarGroup.findByIdAndUpdate(carGroupId, { $pull: { passengers: req.payload._id } })

    if (!updatedCarGroup) {
      res.status(400).json({ errorMessage: "No hay grupos de coche con ese id o hubo un problema al remover al usuario del grupo de coche" })
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

  const { carGroupId } = req.params

  const isCarGroupIdValid = validateMongoIdFormat(carGroupId, res, "Id de grupo de coche en formato incorrecto")
  if (!isCarGroupIdValid) return

  try {
    
    const foundCarGroup = await CarGroup.findById(carGroupId).populate("event", "status")

    if (!foundCarGroup) {
      res.status(400).json({ errorMessage: "No hay grupos de coche con ese id" })
      return
    }

    if (foundCarGroup.owner != req.payload._id) {
      res.status(401).json({errorMessage: "No puedes borrar este grupo de coche porque no eres el dueño"})
      return
    }

    if (foundCarGroup.event.status === "cancelled") {
      res.status(400).json({ errorMessage: "Este evento ha sido cancelado, no es necesario borrar grupo de coche" })
      return
    }

    if (foundCarGroup.event.status === "closed") {
      res.status(400).json({ errorMessage: "Este evento está cerrado, no puedes borrar el grupo de coche. Contacta a un Admin o el organizador del evento para poder borrarlo" })
      return
    }

    //* open event only
    await CarGroup.findByIdAndDelete(carGroupId)
    //todo notificacion a usuarios si se borra el grupo de coche aqui
    //todo borrar todos los mensajes de ese grupo de coche

    res.sendStatus(202)

  } catch (error) {
    next(error)
  }

})

module.exports = router;