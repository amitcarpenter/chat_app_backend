const express = require("express");
const { getUserChat, saveUserChat, getAllRooms } = require("./chatController");
const { IO } = require("../../server");
const { User } = require("../user/userModal");
const multer = require("multer");
const fs = require("fs");

const { compressImage } = require("../middleware/imageCompress");
const upload = require("../middleware/handleImage");

const router = express.Router();

//post routes
router.post(
  "/sendmessage",
  upload.single("image"),
  compressImage,
  handleMessages
);

//get routes...
router.get("/getrooms", handleAllRooms);
router.get("/:roomId/:skip/:limit", handleUserChat);

// exports.router = router;



// handle all rooms
async function handleAllRooms(req, res) {
  try {
    const authHeader = req.headers["authorization"];
    const auth_token = authHeader.split(" ")[1];
    const allRooms = await getAllRooms(auth_token);
    if (allRooms && typeof allRooms === "object") {
      const sortroomchat = allRooms.sort(
        (a, b) =>
          new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
      );
      res.status(200).json({ data: sortroomchat, success: true });
    } else {
      res.status(200).json({ message: allRooms, data: [], success: true });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Something went wrong",
      success: false,
    });
  }
}

// get rooms previous chat
async function handleUserChat(req, res) {
  try {
    const roomId = req.params.roomId;
    let skip = req.params.skip;
    let limit = req.params.limit;
    const userChat = await getUserChat(roomId, skip, limit);
    if (userChat && typeof userChat === "object") {
      const getmessageData = await Promise.all(
        userChat.roomChat[0].messages.map(async (item) => {
          let userDetail = await User.findById(item.userId);
          return {
            ...item,
            user: {
              _id: userDetail._id,
              avatar: userDetail.avatar,
              first_name: userDetail.first_name,
              last_name: userDetail.last_name,
            },
          };
        })
      );
      res.status(200).json({
        data: getmessageData,
        success: true,
        totalLength: userChat.totallength,
      });
    } else {
      res.status(200).json({ message: userChat, success: true, data: [] });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Something went wrong",
      success: false,
    });
  }
}

// handle user new message
async function handleMessages(req, res) {
  let imageFile = "";
  if (req.file) {
    imageFile = `chat/${req.file.filename}`;
    imageFile = imageFile.replace(".jpg", "_2.jpg");
  }
  try {
    const { _id, text, createdAt, roomId, receiverId, senderId, userId } =
      req.body;
    const senderUser = await User.find({ _id: senderId });
    const receiverUser = await User.find({ _id: receiverId });
    if (senderUser.length === 0 || receiverUser.length === 0) {
      // res.status(400).json({ success: false, message: " wrong user" });
      throw error;
    }

    const message = {
      _id: _id,
      text: text,
      createdAt: createdAt,
      userId: userId,
      image: imageFile || "",
    };

    const saveChat = await saveUserChat(message, roomId, receiverId, senderId);
    let messageSender = await User.findOne({ _id: message.userId });
    const sendMesssageToUser = {
      ...message,
      user: {
        _id: message.userId,
        avatar: messageSender.avatar,
        name: messageSender.first_name + messageSender.last_name,
      },
    };
    IO.sendMessageToUser(receiverId, sendMesssageToUser, roomId, senderId);
    res
      .status(200)
      .json({ data: message, success: true, message: "message sent" });
  } catch (error) {
    res
      .status(400)
      .json({ success: false, message: "Something went wrong", data: {} });
  }
}


module.exports = router;