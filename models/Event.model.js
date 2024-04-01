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
    isCancelled: {
      type: Boolean,
      default: false
    }
    //todo change to status, canceled, open, closed
  },
  {
    timestamps: true,
  }
);

const Event = model("Event", eventSchema);

module.exports = Event;
