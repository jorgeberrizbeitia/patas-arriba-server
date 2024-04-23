const { Schema, model } = require("mongoose");

const attendeeSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event"
    },
    attendance: {
      type: String,
      enum: ["pending", "show", "no-show", "excused"],
      default: "pending",
      //* status when event has been closed to determine user participation set by admin
    },
    task: {
      type: String,
      maxLength: 50
      //* assigned by admin only
    },
    willArriveOnMyOwn: {
      type: Boolean,
      //* changed to true by user if doesn't want to create car or search one
    },
  },
  {
    timestamps: true,
  }
);

const Attendee = model("Attendee", attendeeSchema);

module.exports = Attendee;