const { Schema, model } = require("mongoose");

const carGroupSchema = new Schema(
  {
    roomAvailable: {
      type: Number,
      required: true
    },
    pickupLocation: {
      type: String,
      required: [true, "Pickup Location is required."],
      trim: true,
      maxLength: 200
    },
    pickupTime: {
      type: String,
      required: true
    },
    carColor: {
      type: String,
      required: [true, "Car Color is required."],
      maxLength: 50
    },
    carBrand: {
      type: String,
      required: [true, "Car Brand is required."],
      maxLength: 50
    },
    isCancelled: {
      type: Boolean
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    passengers: [{
      type: Schema.Types.ObjectId,
      ref: "User"
    }],
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event"
    },
  },
  {
    timestamps: true,
  }
);

carGroupSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); //* 90 days

const CarGroup = model("CarGroup", carGroupSchema);

module.exports = CarGroup;