const { Schema, model } = require("mongoose");

const notificationSchema = new Schema(
  {
    text: {
      type: String,
      required: [true, "Text is required."],
      trim: true,
      maxLength: 140
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    relatedModel: {
      type: String,
      enum: ["Event", "CarGroup", "User"],
      //* the model it is related to
      required: true
    },
    //? relatedType might be obsolete. Test first.
    relatedId: {
      type: Schema.Types.ObjectId,
      required: true
      //* can be either Event or CarGroup or User
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); //* 90 days

const Message = model("Message", notificationSchema);

module.exports = Message;