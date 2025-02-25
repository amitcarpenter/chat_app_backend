const { Activity } = require("../activityFeed/activityModal");
const { ValidUser } = require("../middleware/hanldeValiduser");
const { getSecondUserProfile } = require("../user/userController");
const { User } = require("../user/userModal");
const { Friend } = require("./addFriendModal");






async function addFriend(authHeader, receiverId, action) {
    try {
        const auth_token = authHeader.split(" ")[1];
        const isValidUser = await ValidUser(auth_token);
        const user = await User.findOne({ auth_token: auth_token });
        if (isValidUser === true) {
            if (action === "ADD") {
                const reqDocument = await Friend.findOne(
                    {
                        $or: [
                            { senderId: user._id, receiverId: receiverId },
                            { senderId: receiverId, receiverId: user._id },
                        ],
                    },
                );
                if (!reqDocument) {
                    const data = {
                        senderId: user._id,
                        receiverId: receiverId,
                        action: "PENDING",
                    };
                    const newFriend = await new Friend(data).save();
                    return newFriend;
                }
                else {
                    return "you aleady send Friend Request"
                }
            } else if (
                action === "CANCEL" ||
                action === "REJECT" ||
                action === "UNFRIEND"
            ) {
                const objectexist = await Friend.findOneAndDelete(
                    {
                        $or: [
                            { senderId: user._id, receiverId: receiverId },
                            { senderId: receiverId, receiverId: user._id },
                        ],
                    },
                    { new: true }
                );
                if (objectexist) {
                    const reqDocument = await Friend.findOneAndDelete(
                        {
                            $or: [
                                { senderId: user._id, receiverId: receiverId },
                                { senderId: receiverId, receiverId: user._id },
                            ],
                        },
                        { new: true }
                    );
                    return { message: `request ${action}` };
                } else {
                    return `request already ${action}`
                }
            } else if (action === "ACCEPT") {
                const reqDocument = await Friend.findOneAndUpdate(
                    {
                        $or: [
                            { senderId: user._id, receiverId: receiverId },
                            { senderId: receiverId, receiverId: user._id },
                        ],
                    },
                    { action: "ACCEPTED" },
                    { new: true }
                );
                return reqDocument;
            }

        } else {
            return isValidUser;
        }
    } catch (error) {
        console.log(error, "errorr");
        throw error;
    }
}

module.exports = { addFriend }