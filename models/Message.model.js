const { Schema, model } = require("mongoose");

const messageSchema = new Schema(
  {
    text: {
      type: String,
      required: [true, "Text is required."],
      trim: true,
      maxLength: 300
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    relatedType: {
      type: String,
      enum: ["event", "car-group"],
      required: true
    },
    relatedId: {
      type: Schema.Types.ObjectId,
      required: true
    },
    isDeleted: {
      type: Boolean
    }
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); //* 90 days

const Message = model("Message", messageSchema);

module.exports = Message;