const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  userId: {
    type: String,
  },
  file: {
    type: String,
  },

  caption: {
    type: String,
  },
  totalLike: [
    {
      userId: {
        type: String,
      },
    },
  ],
  comments: [
    {
      userId: {
        type: String,
      },
      comment: {
        type: String,
      },
      createdAt: {
        type: Date,
      },
    },
  ],
  location: {
    type: String,
  },
  longitude: {
    type: Number,
  },
  latitude: {
    type: Number,
  },
  createdAt: {
    type: Date,
  },
  mimeType: {
    type: String,
  },
  tag: {
    type: String,
  },
  visibility: {
    type: String,
  },
});

exports.Activity = mongoose.model("Activity", activitySchema);
