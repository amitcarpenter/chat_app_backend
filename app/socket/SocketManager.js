const socketIO = require("socket.io");
const { server } = require("../../server")
const axios = require("axios");
const { saveBotChat } = require("../userChat/chatController");
const { User } = require("../user/userModal");

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
    });
  }

  sendMessageToUser(receiverId, sendMesssageToUser, roomId, senderId) {
    const sendMessage = [{ ...sendMesssageToUser, roomId: roomId }];
    let socketID = SocketManager.connectedUsers[receiverId];
    let senderSocketId = SocketManager.connectedUsers[senderId];

    SocketManager.io.to(senderSocketId).emit("sendermessage", sendMessage);

    // console.log(socketID , "socketID");
    // console.log(senderSocketId , "senderSocketId");
    // console.log(SocketManager.connectedUsers , "SocketManagerSocketManager");

    if (socketID) {
      SocketManager.io.to(socketID).emit("private-message", sendMessage);
    } else {
      console.log(`User ${receiverId} is not connected`);
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

}

let SocketIO = new SocketManager(server);

module.exports = { SocketManager, SocketIO }
