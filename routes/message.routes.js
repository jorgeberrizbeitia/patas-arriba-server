const express = require("express");
const router = express.Router();

const Message = require("../models/Message.model");
const Event = require("../models/Event.model");
const CarGroup = require("../models/CarGroup.model");

const validateMongoIdFormat = require("../utils/validateMongoIdFormat")
const validateRequiredFields = require("../utils/validateRequiredFields")

// POST "/api/message/:eventId/event" - Creates a new message in an event
router.post("/:eventId/event", async (req, res, next) => {

  const { eventId } = req.params
  const { text } = req.body

  const isEventIdValid = validateMongoIdFormat(eventId, res, "Id de evento en formato incorrecto")
  if (!isEventIdValid) return

  const areRequiredFieldsValid = validateRequiredFields(res, text)
  if (!areRequiredFieldsValid) return

  try {

    const event = await Event.findById(eventId)
    if (!event) {
      res.status(400).json({ errorMessage: "No hay eventos con ese id" })
      return
    }

    if (!event.participants.includes(req.payload._id)) {
      res.status(401).json({ errorMessage: "No puedes crear mensajes en este evento porque no perteneces a este evento" })
      return
    }
    
    const createdMessage = await Message.create({
      text,
      sender: req.payload._id
    })

    if (!createdMessage) {
      res.status(500).json({ errorMessage: "Hubo un problema creando el mensaje" })
      return
    }

    const updatedEvent = await Event.findByIdAndUpdate(eventId, { $addToSet: { messages: createdMessage._id } })
    //! this might later be changed to use socket

    if (!updatedEvent) {
      // below to delete the message if the event doesn't exist or was a problem adding it to the event
      await Message.findByIdAndDelete(createdMessage._id) 
      res.status(500).json({ errorMessage: "Hubo un problema al añadir el mensaje al evento" })
      return
    }

    res.status(201).json(createdMessage) //! check frontend need

  } catch (error) {
    next(error)
  }

})

// POST "/api/message/:carGroupId/car-group" - Creates a new message in a car-group
router.post("/:carGroupId/car-group", async (req, res, next) => {

  const { carGroupId } = req.params
  const { text } = req.body

  const isCarEventIdValid = validateMongoIdFormat(carGroupId, res, "Id del grupo de coche en formato incorrecto")
  if (!isCarEventIdValid) return

  try {

    const carGroup = await CarGroup.findById(carGroupId)
    if (!carGroup) {
      res.status(400).json({ errorMessage: "No hay grupos de coche con ese id" })
      return
    }

    if (!carGroup.members.includes(req.payload._id)) {
      res.status(401).json({ errorMessage: "No puedes crear mensajes en este grupo de coche porque no perteneces a este grupo de coche" })
      return
    }
    
    const createdMessage = await Message.create({
      text,
      sender: req.payload._id
    })

    if (!createdMessage) {
      res.status(500).json({ errorMessage: "Hubo un problema creando el mensaje" })
      return
    }

    const updatedCarGroup = await CarGroup.findByIdAndUpdate(carGroupId, { $addToSet: { messages: createdMessage._id } })
    //! this might later be changed to use socket

    if (!updatedCarGroup) {
      // below to delete the message if the event doesn't exist
      await Message.findByIdAndDelete(createdMessage._id) 
      res.status(400).json({ errorMessage: "Hubo un problema al añadir el mensaje al grupo de coche" })
      return
    }

    res.sendStatus(201).json(createdMessage) //! check frontend need

  } catch (error) {
    next(error)
  }

})

//todo refactorizar dos rutas anteriores a una sola

// DELETE "/api/message/:messageId" - Deletes a message (only owner or admin)
router.delete("/:messageId", async (req, res, next) => {

  const { messageId } = req.params

  const isMessageIdValid = validateMongoIdFormat(messageId, res, "Id del mensaje en formato incorrecto")
  if (!isMessageIdValid) return

  try {
    
    const foundMessage = await Message.findById(messageId)

    if (!foundMessage) {
      res.status(400).json({errorMessage: "Mensaje no existe por ese id"})
      return
    }

    if (req.payload._id != foundMessage.sender._id && req.payload.role !== "admin") {
      res.status(401).json({ errorMessage: "No tienes permiso de borrar este mensaje (solo quien envía el mensaje o admin)" })
      return
    }

    await Message.findByIdAndDelete(foundMessage._id)

    res.sendStatus(202)

  } catch (error) {
    next(error)
  }

})

module.exports = router;  