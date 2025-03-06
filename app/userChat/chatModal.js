const mongoose = require("mongoose");
const chatSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
  },
  users: [
    {
      senderId: {
        type: String,
      },

      receiverId: {
        type: String,
      },
    },
  ],
  messages: [
    {
      _id: {
        type: String,
      },
      text: {
        type: String,
      },
      createdAt: {
        type: Date,
      },
      userId: {
        type: String,
      },
      image: {
        type: String,
      },

      is_read: {
        type: Boolean,
      },

      Seen: Boolean,
    },
  ],
});

exports.Chat = mongoose.model("Chat", chatSchema);
