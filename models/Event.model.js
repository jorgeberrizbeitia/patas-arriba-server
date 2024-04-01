const { Schema, model } = require("mongoose");

const eventSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required."],
      trim: true,
      maxLength: 50
    },
    location: {
      type: String,
      required: [true, "Location is required."],
      trim: true,
      maxLength: 50
    },
    coordinates: {
      type: [Number],
    },
    date: {
      type: Date,
      required: [true, "Date is required."]
    },
    time: {
      type: String,
      required: [true, "Time is required."]
    },
    category: {
      type: String,
      enum: ["car-group", "no-car-group"]
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    participants: [{
      type: Schema.Types.ObjectId,
      ref: "User"
    }],
    messages: [{
      type: Schema.Types.ObjectId,
      ref: "Message"
    }],
    status: {
      type: String,
      default: "open",
      enum: ["open", "closed", "cancelled"]
    }
  },
  {
    timestamps: true,
  }
);

const Event = model("Event", eventSchema);

module.exports = Event;
