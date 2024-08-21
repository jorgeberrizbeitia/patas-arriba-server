const express = require("express");
const router = express.Router();

const Message = require("../models/Message.model");
const CarGroup = require("../models/CarGroup.model");

const validateMongoIdFormat = require("../utils/validateMongoIdFormat")
const validateRequiredFields = require("../utils/validateRequiredFields");
const Attendee = require("../models/Attendee.model");
const PushSubscription = require("../models/PushSubscription.model");

const webpush = require('web-push');

webpush.setVapidDetails(
    process.env['PUSH_SUBJECT'],
    process.env['PUSH_PUBLIC_KEY'],
    process.env['PUSH_PRIVATE_KEY']
);

async function sendPushNotifications(createdMessage) {

  const attendees = await Attendee.find({event: createdMessage.relatedId, user: {$ne: createdMessage.sender}});
  const userIds = attendees.map(attendee => attendee.user);
  // const subscriptions = await PushSubscription.find({ user: { $in: userIds } });
  const subscriptions = await PushSubscription.find(); //! line for testing multiple push. Remove and uncommend above one.

  // subscriptions.forEach(subscription => {
  //   webpush.sendNotification(subscription.subscription, JSON.stringify({
  //     title: "New Message:",
  //     text: createdMessage.text
  //   }));
  // });

  //! replacing above with promiseAll to minimize work time
  const notificationPromises = subscriptions.map(subscription =>
    webpush.sendNotification(subscription.subscription, JSON.stringify({
      title: "New Message:",
      text: createdMessage.text
    }))
  );

  await Promise.all(notificationPromises); // all notifications sent at the same time.

}

// POST "/api/message/:relatedType/:relatedId" - Creates a new message in an event or car group
router.post("/:relatedType/:relatedId", async (req, res, next) => {

  const { relatedType, relatedId } = req.params

  const { text } = req.body

  const isIdValid = validateMongoIdFormat(relatedId, res, "Id de evento o grupo de coche en formato incorrecto")
  if (!isIdValid) return

  const areRequiredFieldsValid = validateRequiredFields(res, text)
  if (!areRequiredFieldsValid) return

  const allowedRelatedTypes = ["event", "car-group"]
  if (allowedRelatedTypes.includes(relatedType) === false) {
    res.status(400).json({ errorMessage: "Tipo de relación incorrecta. Envia 'event' o 'car-group' dependiendo de donde quieres crear un mensaje"})
    return
  }

  try {

    if (relatedType === "event" && req.payload.role !== "admin") {
      const attendee = await Attendee.findOne({event: relatedId, user: req.payload._id})
      if (!attendee) {
        res.status(400).json({ errorMessage: "No se ha conseguido evento con ese id o no te has unido al evento" })
        return
      }
    } 
    
    else if (relatedType === "car-group") {
      const carGroup = await CarGroup.findById(relatedId);
      if (!carGroup) {
        res.status(400).json({ errorMessage: "No hay grupos de coche con ese id" })
        return
      }
      if (req.payload.role !== "organizer" && req.payload.role !== "admin" && carGroup.owner != req.payload._id && carGroup.passengers.includes(req.payload._id) === false) {
        res.status(400).json({ errorMessage: "No puedes crear mensajes en un grupo de coche al que no perteneces, o no eres organizador/admin" })
        return
      }
    }
    
    const createdMessage = await Message.create({
      text,
      sender: req.payload._id,
      relatedType,
      relatedId,
    })

    if (!createdMessage) {
      res.status(500).json({ errorMessage: "Hubo un problema creando el mensaje" })
      return
    }

    res.sendStatus(201)
    
    sendPushNotifications(createdMessage) //* push notifications sent after response is sent to the client. If they fail, potentially removing timeout issue.

  } catch (error) {
    next(error)
  }

})

// GET "/api/message/:relatedType/:relatedId" - Finds all messages of an event or car group
router.get("/:relatedType/:relatedId", async (req, res, next) => {

  const { relatedType, relatedId } = req.params

  const isIdValid = validateMongoIdFormat(relatedId, res, "Id de evento o grupo de coche en formato incorrecto")
  if (!isIdValid) return

  const allowedRelatedTypes = ["event", "car-group"]
  if (allowedRelatedTypes.includes(relatedType) === false) {
    res.status(400).json({ errorMessage: "Tipo de relación incorrecta. Envia 'event' o 'car-group' dependiendo de donde quieres crear un mensaje"})
    return
  }

  try {
    
    const messages = await Message
    .find({ relatedType, relatedId })
    .populate("sender", "username fullName icon iconColor role")

    res.status(200).send(messages)

  } catch (error) {
    next(error)
  }

})

// DELETE "/api/message/:messageId/delete" - Updates message to deleted (only owner or admin)
router.patch("/:messageId/delete", async (req, res, next) => {

  const { messageId } = req.params

  const isMessageIdValid = validateMongoIdFormat(messageId, res, "Id del mensaje en formato incorrecto")
  if (!isMessageIdValid) return

  try {

    if (req.payload.role === "user") {
      const deletedMessage = await Message.findOneAndUpdate({
        _id: messageId, 
        sender: req.payload._id
      }, {
        isDeleted: true,
        text: "Mensaje eliminado"
      })
      if (!deletedMessage) {
        res.status(400).json({ errorMessage: "Mensaje no encontrado con ese id o no tienes permisos para borrarlo" })
        return
      }
    } 
    
    // below so admins can delete any messages
    else if (req.payload.role === "admin") {
      const deletedMessage = await Message.findByIdAndUpdate(messageId, {
        isDeleted: true,
        text: "Mensaje Borrado"
      })
      if (!deletedMessage) {
        res.status(400).json({ errorMessage: "Mensaje no encontrado con ese id" })
        return
      }
    }

    res.sendStatus(202)

  } catch (error) {
    next(error)
  }

})

module.exports = router;  
