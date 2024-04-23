const { Schema, model } = require("mongoose");

const carGroupSchema = new Schema(
  {
    roomAvailable: {
      type: Number,
      max: 10,
    },
    pickupLocation: {
      type: String,
      trim: true,
      maxLength: 200
    },
    pickupTime: {
      type: String,
      maxLength: 10
    },
    carColor: {
      type: String,
      maxLength: 50
    },
    carBrand: {
      type: String,
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