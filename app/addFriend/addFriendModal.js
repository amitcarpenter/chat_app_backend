const mongoose = require("mongoose");

const addFriendSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Types.ObjectId,
        ref: 'User'
    },
    receiverId: {
        type: mongoose.Types.ObjectId,
        ref: 'User'
    },
    action: {
        type: String, enum: ['ACCEPTED', 'PENDING'], default: ''
    }
});

exports.Friend = mongoose.model("Friend", addFriendSchema);
