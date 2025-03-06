const socketIO = require("socket.io");
const { server } = require("../../server")
const axios = require("axios");
const { saveBotChat, getAllRooms } = require("../userChat/chatController");
const { User } = require("../user/userModal");
const { Chat } = require("../userChat/chatModal");

const ai_endpoint = process.env.AI_ENDPOINT

class SocketManager {

  static connectedUsers = {};

  constructor(server) {
    SocketManager.io = socketIO(server);
    this.sender = "";
    this.initializeSocketEvents();
  }

  extractUserId(socket) {
    const userId = socket.handshake.query.userId;
    return userId;
  }

  initializeSocketEvents() {
    SocketManager.io.on("connection", async (socket) => {
      const userId = this.extractUserId(socket);
      console.log("Connected", userId);
      SocketManager.connectedUsers[userId] = socket.id;

      socket.on("disconnect", () => {
        const userID = Object.keys(SocketManager.connectedUsers).find(
          (key) => SocketManager.connectedUsers[key] === socket.id
        );
        if (userID) {
          delete SocketManager.connectedUsers[userID];
          console.log(`User ${userID} disconnected`);
        }
      });


      socket.on('userTyping', (data) => {
        console.log(data);

        const recipientSocket = data.recipient;
        if (recipientSocket) {
          SocketManager.io.to(recipientSocket).emit('userIsTyping', data);
        }
      });

    });
  }

  async sendMessageToUser(receiverId, sendMesssageToUser, roomId, senderId) {
    const [user1, user2] = roomId.split("_");
    const actualReceiverId = senderId === user1 ? user2 : user1;

    let receiverSocketId = SocketManager.connectedUsers[actualReceiverId];
    let senderSocketId = SocketManager.connectedUsers[senderId];

    let sendMessage = [{
      ...sendMesssageToUser,
      roomId: roomId,
      is_read: !!receiverSocketId
    }];

    if (senderSocketId) {
      SocketManager.io.to(senderSocketId).emit("sendermessage", sendMessage);
    }

    if (receiverSocketId) {
      SocketManager.io.to(receiverSocketId).emit("private-message", sendMessage);

      try {
        await Chat.updateOne(
          { roomId: roomId },
          { $set: { "messages.$[elem].is_read": true } },
          { arrayFilters: [{ "elem._id": sendMesssageToUser._id }] }
        );
      } catch (error) {
        console.log(error.message);
      }



    } else {
      console.log(`User ${actualReceiverId} is not connected`);
    }
  }

  async sendMessageToBot(receiverId, message, roomId, senderId) {
    const sendMessage = [{ ...message, roomId: roomId }];

    let socketID = SocketManager.connectedUsers[senderId];
    let senderSocketId = SocketManager.connectedUsers[senderId];

    if (socketID) {
      SocketManager.io.to(socketID).emit("private-message", sendMessage);
      console.log(sendMessage, "sendMessage");
      console.log("private event call");
    } else {
      console.log(`User ${receiverId} is not connected`);
    }
    let botResponseData = null;
    try {
      const botResponse = await axios.post(
        `${ai_endpoint}`,
        {
          input: `\nYou: Hello!\nUser: ${message.text}\n`,
          generator_kwargs: {
            max_new_tokens: 128,
            do_sample: true,
            temperature: 0.01,
            top_p: 0.9,
            num_return_sequences: 1,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 60000,
        }
      );
      botResponseData = botResponse.data.output;
      // bot_response_message = botResponseData || "Bot did not return a response";
      console.log("Bot Response:", botResponseData);
      if (botResponseData) {
        let message_id = message._id + 2
        const botMessage = [{
          _id: `${message_id}`,
          text: botResponseData,
          createdAt: new Date(),
          userId: receiverId,
          image: "",
          user: {
            _id: receiverId,
            avatar: message.user.avatar,
            name: message.user.name,
          },
        }];
        console.log(botMessage, "botMessage");
        await saveBotChat(botMessage, roomId, senderId, receiverId);
        SocketManager.io.to(senderSocketId).emit("sendermessage", botMessage);
        console.log("sender event call");
      }
    } catch (error) {
      console.error("Bot API Error:", error.response?.data || error.message);
    }
  }

  async getSocketRooms(receiverId, roomId, senderId) {
    let auth_token_user = await User.findOne({ _id: receiverId })
    if (auth_token_user) {
      let auth_token = auth_token_user.auth_token
      const allRooms = await getAllRooms(auth_token);

      if (Array.isArray(allRooms)) {
        const sortedRooms = allRooms.sort((a, b) => {
          if (!a.lastMessage || !b.lastMessage) return 0;
          return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
        });
        let senderSocketId = SocketManager.connectedUsers[receiverId];
        if (senderSocketId) {
          SocketManager.io.to(senderSocketId).emit('get-socket-rooms', sortedRooms);
        }
      }
    }

  }


  TypingEvent(data) {
    console.log(data);
    const recipientSocket = data.recipient;
    let senderSocketId = SocketManager.connectedUsers[recipientSocket];
    console.log(senderSocketId, "senderSocketId");

    if (senderSocketId) {
      SocketManager.io.to(senderSocketId).emit('userIsTyping', data);
    }
  }

  MessageReadIds(actualReceiverId, data) {
    let senderSocketId = SocketManager.connectedUsers[actualReceiverId];
    if (senderSocketId) {
      SocketManager.io.to(senderSocketId).emit('message-read-update', data);
    }
  }


}

let SocketIO = new SocketManager(server);

module.exports = { SocketManager, SocketIO }

