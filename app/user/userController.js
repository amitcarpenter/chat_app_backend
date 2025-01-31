const { Activity } = require("../activityFeed/activityModal");
const { Friend } = require("../addFriend/addFriendModal");
const { ValidUser } = require("../middleware/hanldeValiduser");
const { User } = require("./userModal");

async function userRegisterController(userData) {
  try {
    const { email } = userData;
    const user = await User.findOne({ email });
    if (user) {
      return "User already Exist";
    }
    if (isObjectEmpty(userData)) return "User data is required";
    const newUser = await new User(userData).save();
    return { message: "User created successfully", user: newUser };
  } catch (error) {
    throw error;
  }
}

async function authUpdateToken(tokenUpdate) {
  try {
    const { email, auth_token } = tokenUpdate;
    const user = await User.findOne({ email });
    if (!user) {
      return "No such user exists";
    }
    user.auth_token = auth_token;
    await user.save();

    return { message: "auth_token updated Successfully", user };
  } catch (error) {
    throw error;
  }
}

async function getAllUsers(authHeader) {
  try {
    const auth_token = authHeader.split(" ")[1];
    const isValidUser = await ValidUser(auth_token);
    if (isValidUser === true) {
      const result = await User.find();
      const filterCurrentUser = result.filter(
        (item) => auth_token !== item.auth_token
      );
      return filterCurrentUser;
    }
    return isValidUser;
  } catch (error) {
    throw error;
  }
}
async function getuserProfile(authHeader) {
  try {
    const auth_token = authHeader.split(" ")[1];
    const userProfile = await User.findOne({ auth_token });
    const FriendCount = await Friend.find({
      $or: [{ senderId: userProfile._id }, { receiverId: userProfile._id }],
      action: "ACCEPTED",
    })
    const reqIncoming = await Friend.find({
      receiverId: userProfile._id,
      action: "PENDING"
    })
    const reqSend = await Friend.find({
      senderId: userProfile._id,
      action: "PENDING"
    })
    const postCount = await Activity.find({ userId: userProfile._id })

    if (!userProfile) {
      return "Unauthorised User";
    }
    return { userProfile, friendCount: FriendCount.length, reqIncomingCount: reqIncoming.length, reqSend: reqSend.length, postCount: postCount.length };
  } catch (error) {
    throw error
  }
}
async function updateUserProfile(header, body, imageFile) {
  const authHeader = header["authorization"];
  let auth_token;
  if (authHeader) {
    auth_token = authHeader.split(" ")[1];
  } else {
    return "Unauthorised User";
  }
  const isValidUser = await ValidUser(auth_token);
  try {
    if (isValidUser === true) {
      const getUser = await User.findOne({ auth_token });
      let updateUser = {
        first_name: body?.first_name || getUser.first_name,
        last_name: body?.last_name || getUser.last_name,
        phone: body?.phone || getUser.phone,
        bio: body?.bio || getUser.bio,
        location: body?.location || getUser.location,
        avatar: imageFile || getUser.avatar,
      };
      const userUpdate = await User.findOneAndUpdate(
        { auth_token },
        updateUser
      );
      return userUpdate;
    } else {
      return isValidUser;
    }
  } catch (error) {
    throw error;
  }
}
async function getSecondUserProfile(authHeader, userId) {
  try {
    let isUserLogin;
    let myProfile;
    if (authHeader) {
      const auth_token = authHeader.split(" ")[1];
      isUserLogin = await ValidUser(auth_token);
      if (isUserLogin === true) {
        myProfile = await User.findOne({ auth_token: auth_token });
      }
    }

    const userDetail = await User.findById(userId);
    if (myProfile) {
      const userfeed = await Activity.find({ userId: userDetail._id });
      const isUserFriend = await Friend.find({
        $or: [
          { senderId: myProfile._id, receiverId: userId },
          { senderId: userId, receiverId: myProfile._id },
        ],
      });
      const feedData = userfeed.map((item) => {
        const isUserFeedLike = item.totalLike.some(
          (item) => item.userId === myProfile._id.toString()
        );
        if (isUserFriend.length < 0 || isUserFriend[0]?.action === "ACCEPTED" || item.visibility !== "Private") {
          return {
            _id: item.id,
            userId: item.userId,
            file: item.file,
            caption: item.caption,
            totalLike: item.totalLike,
            comments: item.comments,
            location: item.location,
            longitude: item.longitude,
            latitude: item.latitude,
            userAvatar: userDetail.avatar,
            first_name: userDetail.first_name,
            last_name: userDetail.last_name,
            isUserFeedLike: isUserFeedLike,
            createdAt: item.createdAt,
            visibility: item.visibility,
            mimeType: item.mimeType,
            tag: item.tag,
          };
        } else {
          return null;
        }
      });
      const data = feedData.filter((item) => item !== null);
      const sortedfeedData = data.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      if (isUserFriend.length > 0) {
        return {
          bio: userDetail.bio,
          sortedfeedData,
          action: isUserFriend[0]?.action,
          receiverId: isUserFriend[0]?.receiverId,
        };
      } else {
        return { bio: userDetail.bio, sortedfeedData, action: "" };
      }
    } else {
      const userfeed = await Activity.find({ userId: userDetail._id });
      const feedData = userfeed.map((item) => {
        return {
          _id: item.id,
          userId: item.userId,
          file: item.file,
          caption: item.caption,
          totalLike: item.totalLike,
          comments: item.comments,
          location: item.location,
          longitude: item.longitude,
          latitude: item.latitude,
          userAvatar: userDetail.avatar,
          first_name: userDetail.first_name,
          last_name: userDetail.last_name,
          createdAt: item.createdAt,
          visibility: item.visibility,
          mimeType: item.mimeType,
          tag: item.tag,
        };
      });
      const sortedfeedData = feedData.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      return { bio: userDetail.bio, sortedfeedData, action: "" };
    }
  } catch (error) {
    console.log("error", error);
    throw error;
  }
}

const isObjectEmpty = (objectName) => {
  return (
    objectName &&
    Object.keys(objectName).length === 0 &&
    objectName.constructor === Object
  );
};


async function getRequestList(authHeader, action) {
  try {
    const auth_token = authHeader.split(" ")[1];
    const isValidUser = await ValidUser(auth_token);
    if (isValidUser === true) {
      const getUser = await User.findOne({ auth_token: auth_token });
      if (action === "REQUEST") {
        const getIncomingReq = await Friend.find({
          receiverId: getUser._id,
          action: "PENDING",
        });
        const getSenderData = await Promise.all(getIncomingReq.map(async (item) => {
          let getsenderDetail = await User.findById(item.senderId);
          return {
            first_name: getsenderDetail.first_name,
            last_name: getsenderDetail.last_name,
            avatar: getsenderDetail.avatar,
            userId: item.senderId
          }

        }))
        return getSenderData;
      } else if (action === "REQUESTSEND") {
        const getSendReq = await Friend.find({
          senderId: getUser._id,
          action: "PENDING",
        });
        const getReceiverData = await Promise.all(getSendReq.map(async (item) => {
          let getReqDetail = await User.findById(item.receiverId);
          return {
            first_name: getReqDetail.first_name,
            last_name: getReqDetail.last_name,
            avatar: getReqDetail.avatar,
            userId: item.receiverId
          }

        }))
        return getReceiverData;
      } else if (action === "FRIEND") {
        const getFriendList = await Friend.find(
          {
            $or: [{ senderId: getUser._id }, { receiverId: getUser._id }],
            action: "ACCEPTED",
          }

        );
        const friendsData = await Promise.all(getFriendList.map(async (item) => {
          let userDetail;
          if (item.senderId.toString() == getUser._id.toString()) {

            userDetail = await User.findById(item.receiverId);
            return {
              first_name: userDetail.first_name,
              last_name: userDetail.last_name,
              avatar: userDetail.avatar,
              userId: item.receiverId
            }
          } else if (item.receiverId.toString() === getUser._id.toString()) {
            userDetail = await User.findById(item.senderId);
            return {
              first_name: userDetail.first_name,
              last_name: userDetail.last_name,
              avatar: userDetail.avatar,
              userId: item.senderId
            }
          } else {
            return "No Such Friend"
          }
        }))
        return friendsData;
      } else if (action === "POST") {
        const getPost = await Activity.find({
          userId: getUser._id

        })
        const data = getPost?.map((item) => {

          const isUserFeedLike = item.totalLike.some(
            (like) => like.userId === getUser._id.toString()
          );

          return {
            _id: item._id,
            userId: getUser._id,
            first_name: getUser.first_name,
            last_name: getUser.last_name,
            file: item.file,
            caption: item.caption,
            totalLike: item.totalLike,
            location: item.location,
            longitude: item.longitude,
            latitude: item.latitude,
            userAvatar: getUser.avatar,
            createdAt: item.createdAt,
            isUserFeedLike: isUserFeedLike,
            visibility: item.visibility,
            mimeType: item.mimeType,
            tag: item.tag
          };



        })
        const sortedfeedData = data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        return sortedfeedData;
      }
    } else {
      return isValidUser;
    }
  } catch (error) {
    throw error;
  }
}

module.exports = { getRequestList, getSecondUserProfile, updateUserProfile, getuserProfile, getAllUsers, authUpdateToken, userRegisterController }