const express = require("express");
const router = express.Router();
const webpush = require('web-push');

webpush.setVapidDetails(
    process.env['PUSH_SUBJECT'],
    process.env['PUSH_PUBLIC_KEY'],
    process.env['PUSH_PRIVATE_KEY']
);

const PushSubscription = require("../models/PushSubscription.model");

const validateMongoIdFormat = require("../utils/validateMongoIdFormat");

router.post("/", async (req, res, next) => {

    try {

        const { subscription } = req.body

        const createdSubscription = await PushSubscription.findOneAndUpdate(
            {user: req.payload._id},
            {$set: {subscription: subscription}},
            {upsert: true, new: true}
        );

        if (!createdSubscription) {
            res.status(500).json({errorMessage: "Hubo un problema creando la subscripción"})
            return
        }

        webpush.sendNotification(subscription, JSON.stringify({title: "Awesome", text: "You are subscribed!"}));
        res.sendStatus(201)

    } catch (error) {
        next(error)
    }
})


module.exports = router;
