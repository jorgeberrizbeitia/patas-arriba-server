const { Schema, model } = require("mongoose");

const carGroupSchema = new Schema(
  {
    pickupCoordinates: {
      type: [Number],
    },
    pickupLocation: {
      type: String,
      required: true,
      trim: true,
      maxLength: 200
    },
    pickupTime: {
      type: Date,
    },
    roomAvailable: {
      type: Number,
      required: true
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event"
    },
    members: [{
      type: Schema.Types.ObjectId,
      ref: "User"
    }],
    chat: [{
      type: Schema.Types.ObjectId,
      ref: "Message"
    }],  
  },
  {
    timestamps: true,
  }
);

const CarGroup = model("CarGroup", carGroupSchema);

module.exports = CarGroup;