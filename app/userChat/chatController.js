const { ValidUser } = require("../middleware/hanldeValiduser");
const { User } = require("../user/userModal");
const { Chat } = require("./chatModal");


async function getUserChat(roomId, skip, limit) {
  try {
    const userchat = await Chat.findOne({ roomId }).lean();

    if (!userchat) {
      return { roomChat: [], totallength: 0 };
    }

    const roomChat = await Chat.aggregate([
      { $match: { roomId } },
      { $unwind: "$messages" },
      { $sort: { "messages.createdAt": -1 } },
      { $skip: skip },
      { $limit: limit },
      { $group: { _id: "$_id", messages: { $push: "$messages" } } },
    ]);

    return { roomChat, totallength: userchat.messages.length };
  } catch (error) {
    console.error("Error in getUserChat:", error.message);
    throw new Error("Failed to retrieve chat data");
  }
}

async function saveUserChat(message, roomId, receiverId, senderId) {
  try {
    const userChat = await Chat.findOne({ roomId });

    if (!userChat) {
      const newChat = {
        roomId,
        users: [
          {
            senderId: senderId,
            receiverId: receiverId,
          },
        ],
        messages: [message],
      };
      await new Chat(newChat).save();
      return newChat;
    } else {
      if (roomId) {
        await Chat.findOneAndUpdate(
          { roomId: roomId },
          {
            $push: {
              messages: message,
            },
          }
        );
      } else {
        throw error;
      }

      return userChat;
    }
  } catch (error) {
    throw error;
  }
}

async function saveBotChat(message, roomId, receiverId, senderId) {
  try {
    const userChat = await Chat.findOne({ roomId });
    if (!userChat) {
      const newChat = {
        roomId,
        users: [
          {
            senderId: senderId,
            receiverId: receiverId,
          },
        ],
        messages: [message],
      };
      await new Chat(newChat).save();
      return newChat;
    } else {
      if (roomId) {
        await Chat.findOneAndUpdate(
          { roomId: roomId },
          {
            $push: {
              messages: message,
            },
          }
        );
      } else {
        throw error;
      }

      return userChat;
    }
  } catch (error) {
    throw error;
  }
}

async function getAllRooms(auth_token) {
  try {
    if (!auth_token) {
      throw new Error("Auth token is required");
    }

    const getCurrentUser = await User.findOne({ auth_token });
    if (!getCurrentUser) {
      throw new Error("Invalid auth token or user not found");
    }

    const isValidUser = await ValidUser(auth_token);
    if (isValidUser !== true) {
      return isValidUser; // If the token is invalid, return the error message
    }

    const CurrentUserId = getCurrentUser._id.toString();
    let allRooms = await Chat.find();

    if (!allRooms.length) {
      return [];
    }

    allRooms = await Promise.all(
      allRooms.map(async (item) => {
        try {
          const lastMessage = item.messages?.length ? item.messages[item.messages.length - 1] : null;

          if (CurrentUserId === item.users[0].senderId) {
            const receiverUser = await User.findById(item.users[0].receiverId);
            return receiverUser
              ? {
                first_name: receiverUser.first_name || "bot",
                avatar: receiverUser.avatar || "",
                last_name: receiverUser.last_name || "bot",
                _id: receiverUser._id || "67a0a2999227256f37d5c02a",
                lastMessage,
              }
              : null;
          } else if (CurrentUserId === item.users[0].receiverId) {
            const senderUser = await User.findById(item.users[0].senderId);
            return senderUser
              ? {
                first_name: senderUser.first_name || "bot",
                avatar: senderUser.avatar || "",
                last_name: senderUser.last_name || "bot",
                _id: senderUser._id || "67a0a2999227256f37d5c02a",
                lastMessage,
              }
              : null;
          } else {
            return null;
          }
        } catch (error) {
          console.error("Error processing room data:", error.message);
          return null;
        }
      })
    );

    return allRooms.filter((room) => room !== null);
  } catch (error) {
    console.error("Error in getAllRooms:", error.message);
    throw new Error(error.message || "Failed to fetch rooms");
  }
}

module.exports = { getUserChat, saveUserChat, getAllRooms, saveBotChat }