const { Schema, model } = require("mongoose");

const eventSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required."],
      trim: true,
      maxLength: 50
    },
    category: {
      type: String,
      enum: ["recogida", "protectora", "mercadillo", "otro"],
      default: "otro"
    },
    description: {
      type: String
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
    hasCarOrganization: {
      type: Boolean,
    },
    hasTaskAssignments: {
      type: Boolean,
    },
    status: {
      type: String,
      enum: ["open", "closed", "cancelled"],
      default: "open",
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
  },
  {
    timestamps: true,
  }
);

const Event = model("Event", eventSchema);

module.exports = Event;
