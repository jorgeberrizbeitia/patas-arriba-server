const {Schema, model} = require("mongoose");

const pushSubscriptionSchema = new Schema(
    {

        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            unique: true,
            index: true
        },

        subscription: {
            type: Object,
            required: true
        }
    },
    {
        timestamps: true,
    }
);

const PushSubscription = model("PushSubscription", pushSubscriptionSchema);

module.exports = PushSubscription;
