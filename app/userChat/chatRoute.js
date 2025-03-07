const express = require("express");
const { getUserChat, saveUserChat, getAllRooms, saveBotChat } = require("./chatController");
const { IO } = require("../../server");
const { User } = require("../user/userModal");
const multer = require("multer");
const fs = require("fs");

const { compressImage } = require("../middleware/imageCompress");
const upload = require("../middleware/handleImage");
const { SocketIO } = require("../socket/SocketManager");
const axios = require("axios");
const { Chat } = require("./chatModal");

const router = express.Router();

router.post("/handlyTyping", handlyTyping);
router.post("/sendmessage", upload.single("image"), compressImage, handleMessages);
router.post("/sendmessage-to-bot", upload.single("image"), compressImage, message_with_bot);
router.get("/getrooms", handleAllRooms);
router.get("/:roomId/:skip/:limit/:user_id", handleUserChat);

let APP_URL = process.env.APP_URL


async function message_with_bot(req, res) {
  let imageFile = "";
  if (req.file) {
    imageFile = `${APP_URL}chat/${req.file.filename}`.replace(".jpg", "_2.jpg");
  }

  try {
    const { _id, text, createdAt, roomId, receiverId, senderId, userId } = req.body;
    const senderUser = await User.findOne({ _id: senderId });
    if (!senderUser) {
      return res.status(400).json({ success: false, message: "Sender not found" });
    }

    const message = {
      _id,
      text,
      createdAt,
      userId,
      image: imageFile || "",
    };

    console.log(message, "message");

    await saveBotChat(message, roomId, receiverId, senderId);

    let messageSender = await User.findOne({ _id: message.userId });

    const sendMessageToUser = {
      ...message,
      user: {
        _id: message.userId,
        avatar: messageSender?.avatar || "",
        name: messageSender ? `${messageSender.first_name} ${messageSender.last_name}` : "Unknown",
      },
    };

    SocketIO.sendMessageToBot(receiverId, sendMessageToUser, roomId, senderId);


    return res.status(200).json({
      success: true,
      message: "Bot responded successfully",
      data: sendMessageToUser,
    });

  } catch (error) {
    console.error("Error:", error.message);
    return res.status(400).json({
      success: false,
      message: "Something went wrong",
      data: {},
      error: error.message,
    });
  }
}

async function handleAllRooms(req, res) {
  try {

    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(200).json({ message: "Please Provide Auth Token", success: false });
    }

    const auth_token = authHeader.split(" ")[1];
    if (!auth_token) {
      return res.status(200).json({ message: "Invalid Auth Token", success: false });
    }

    const allRooms = await getAllRooms(auth_token);

    if (Array.isArray(allRooms)) {
      const sortedRooms = allRooms.sort((a, b) => {
        if (!a.lastMessage || !b.lastMessage) return 0;
        return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
      });

      return res.status(200).json({ data: sortedRooms, success: true });
    } else {
      return res.status(200).json({ message: allRooms, data: [], success: false });
    }
  } catch (error) {
    console.error("Error in handleAllRooms:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
}

async function handleUserChat(req, res) {
  try {
    const { roomId } = req.params;
    let skip = Number(req.params.skip);
    let limit = Number(req.params.limit);
    let user_id = req.params.user_id;

    if (!user_id) return res.json({ success: false, status: 400, message: "user id is not provided" })
    const [user1, user2] = roomId.split("_");
    const actualReceiverId = user_id === user1 ? user2 : user1;

    const chat = await Chat.find(
      {
        roomId: roomId,
        messages: {
          $elemMatch: {
            userId: { $ne: user_id },
            is_read: false
          }
        }
      },
      { "messages._id": 1, _id: 0 }
    );

    const messageIds = chat.flatMap(c =>
      c.messages
        .map(m => m._id)
    );


    if (messageIds.length > 0) {
      await Chat.updateMany(
        { "messages._id": { $in: messageIds } },
        { $set: { "messages.$[elem].is_read": true } },
        { arrayFilters: [{ "elem._id": { $in: messageIds } }] }
      );

      SocketIO.MessageReadIds(actualReceiverId, messageIds);
    }


    if (!roomId) {
      return res.status(200).json({ success: false, message: "roomId is required" });
    }
    if (isNaN(skip) || isNaN(limit) || skip < 0 || limit <= 0) {
      return res.status(200).json({ success: false, message: "Invalid skip or limit values" });
    }

    const userChat = await getUserChat(roomId, skip, limit);

    if (!userChat || !userChat.roomChat.length) {
      return res.status(200).json({ message: "No chat exists", success: false, data: [] });
    }

    const getmessageData = await Promise.all(
      userChat.roomChat[0].messages.map(async (item) => {
        try {
          let userDetail = await User.findById(item.userId).lean();
          return {
            ...item,
            user: {
              _id: item.userId || "67a0a2999227256f37d5c02a",
              avatar: userDetail?.avatar ? userDetail?.avatar : "",
              first_name: userDetail?.first_name || "bot",
              last_name: userDetail?.last_name || "bot",
            },
          };
        } catch (error) {
          console.error("Error fetching user details:", error.message);
          return item;
        }
      })
    );

    return res.status(200).json({
      data: getmessageData || [],
      success: true,
      totalLength: userChat.totallength || 0,
    });
  } catch (error) {
    console.error("Error in handleUserChat:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
}

async function handleMessages(req, res) {
  let imageFile = "";
  if (req.file) {
    imageFile = `${APP_URL}chat/${req.file.filename}`;
    imageFile = imageFile.replace(".jpg", "_2.jpg");
  }
  try {
    const { _id, text, createdAt, roomId, receiverId, senderId, userId, is_read = false } =
      req.body;

    const senderUser = await User.find({ _id: senderId });
    const receiverUser = await User.find({ _id: receiverId });
    if (senderUser.length === 0 || receiverUser.length === 0) {
      throw error;
    }
    const message = {
      _id: _id,
      text: text,
      createdAt: createdAt,
      userId: userId,
      image: imageFile || "",
      is_read: is_read
    };

    const saveChat = await saveUserChat(message, roomId, receiverId, senderId);
    let messageSender = await User.findOne({ _id: message.userId });
    const sendMesssageToUser = {
      ...message,
      user: {
        _id: message.userId,
        avatar: messageSender.avatar || "",
        name: messageSender.first_name + messageSender.last_name,
      },
    };

    SocketIO.sendMessageToUser(receiverId, sendMesssageToUser, roomId, senderId);
    const userChat = await Chat.findOne({ roomId });
    if (userChat) {
      SocketIO.getSocketRooms(receiverId, roomId, senderId)
    }
    return res
      .status(200)
      .json({ data: sendMesssageToUser, success: true, message: "message sent" });
  } catch (error) {
    console.log(error);
    return res
      .status(400)
      .json({ success: false, message: "Something went wrong", data: {} });
  }
}

async function handlyTyping(req, res) {
  try {
    const data = req.body;
    SocketIO.TypingEvent(data);
    return res
      .status(200)
      .json({ message: "user typing" });
  } catch (error) {
    console.log(error);
    return res
      .status(400)
      .json({ success: false, message: "Something went wrong" });
  }
}


module.exports = router;