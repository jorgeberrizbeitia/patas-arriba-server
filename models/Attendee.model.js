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
      default: "show",
      //* New sign-ups are assumed attending; organizer only marks exceptions
      //* (no-show, excused). The "pending" value stays in the enum so legacy
      //* records persisted before this change remain readable.
    },
    task: {
      type: String,
      maxLength: 50
      //* assigned by organizer or admin only
    },
    willArriveOnMyOwn: {
      type: Boolean,
      //* changed to true by user if doesn't want to create car or search one
    }, //! not being used right now. users create single car when going on their own.
  },
  {
    timestamps: true,
  }
);

const Attendee = model("Attendee", attendeeSchema);

module.exports = Attendee;