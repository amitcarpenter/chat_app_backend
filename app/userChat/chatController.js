const { ValidUser } = require("../middleware/hanldeValiduser");
const { User } = require("../user/userModal");
const { Chat } = require("./chatModal");


async function getUserChat(roomId, skip, limit) {
  try {
    const userchat = await Chat.findOne({ roomId });
    if (userchat) {
      const roomChat = await Chat.aggregate([
        { $match: { roomId: roomId } },
        { $unwind: "$messages" },
        { $sort: { "messages.createdAt": -1 } },
        { $limit: Number(limit) },
        { $skip: Number(skip) },
        { $group: { _id: "$_id", messages: { $push: "$messages" } } },
      ]);
      return { roomChat, totallength: userchat.messages.length };
    } else {
      return "No chat exsist";
    }
  } catch (error) {
    throw error;
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

async function getAllRooms(auth_token) {
  try {
    const getCurrentUser = await User.findOne({ auth_token });
    const isValidUser = await ValidUser(auth_token);

    if (isValidUser === true) {
      const CurrentUserId = getCurrentUser._id.toString();
      let allRooms = await Chat.find();

      allRooms = await Promise.all(
        allRooms.map(async (item) => {
          if (CurrentUserId === item.users[0].senderId) {
            let receiverUser = await User.findById(item.users[0].receiverId);
            return {
              first_name: receiverUser.first_name,
              avatar: receiverUser.avatar,
              last_name: receiverUser.last_name,
              _id: receiverUser._id,
              lastMessage: item.messages[item.messages.length - 1],
            };
          } else if (CurrentUserId === item.users[0].receiverId) {
            let senderUser = await User.findById(item.users[0].senderId);
            return {
              first_name: senderUser.first_name,
              avatar: senderUser.avatar,
              last_name: senderUser.last_name,
              _id: senderUser._id,
              lastMessage: item.messages[item.messages.length - 1],
            };
          } else {
            return null;
          }
        })
      );

      allRooms = allRooms.filter((room) => room !== null);
      return allRooms;
    } else {
      return isValidUser;
    }
  } catch (error) {
    throw error;
  }
}


module.exports = { getUserChat, saveUserChat, getAllRooms }