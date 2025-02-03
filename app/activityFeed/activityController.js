const { Activity } = require("./activityModal");
const { ValidUser } = require("../middleware/hanldeValiduser");
const { User } = require("../user/userModal");
const { Friend } = require("../addFriend/addFriendModal");


async function createNewFeed(
  auth_token,
  userId,
  caption,
  location,
  imageFile,
  longitude,
  latitude,
  mimeType,
  tag,
  visibility
) {
  try {
    const isValidUser = await ValidUser(auth_token);
    if (isValidUser === true) {
      const newFeedData = {
        userId: userId,
        file: imageFile || "",
        caption: caption || "",
        totalLike: [],
        comments: [],
        location: location || "",
        longitude: longitude,
        latitude: latitude,
        createdAt: new Date(),
        mimeType: mimeType,
        tag: tag,
        visibility: visibility || "Public",
      };
      const newFeed = await new Activity(newFeedData).save();
      return newFeed;
    } else {
      return isValidUser;
    }
  } catch (error) {
    throw error;
  }
}

async function getAllFeed(authHeader) {
  try {
    let myProfile;
    if (authHeader) {
      const auth_token = authHeader.split(" ")[1];
      const isUserLogin = await ValidUser(auth_token);
      if (isUserLogin === true) {
        myProfile = await User.findOne({ auth_token: auth_token });
      }
    }
    const allfeed = await Activity.find();
    if (myProfile) {
      const feedDataToSend = await Promise.all(
        allfeed.map(async (item) => {
          let getUser = await User.findById(item.userId);
          const isUserFeedLike = item.totalLike.some(
            (like) => like.userId === myProfile._id.toString()
          );
          const reqDocument = await Friend.find(
            {
              $or: [
                { senderId: myProfile._id, receiverId: item.userId },
                { senderId: item.userId, receiverId: myProfile._id },
              ],
            },
            { action: "ACCEPTED" }
          );
          if (
            item.userId == myProfile._id ||
            reqDocument.length > 0 ||
            item.visibility === "Public"
          ) {
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
              mimeType: item.mimeType,
              tag: item.tag,
              visibility: item.visibility,
            };
          } else {
            return null;
          }
        })
      );
      const data = feedDataToSend.filter((item) => item !== null);
      return data;
    } else {
      const feedDataToSend = await Promise.all(
        allfeed.map(async (item) => {
          let getUser = await User.findById(item.userId);
          if (item.visibility === "Public") {
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
              tag: item.tag,
              visibility: item.visibility,
            };
          }

          return null;
        })
      );
      const data = feedDataToSend.filter((item) => item !== null);
      return data;
    }
  } catch (error) {
    throw error;
  }
}

async function feedLike(feedId, userId) {
  try {
    const getAllFeed = await Activity.findById(feedId);
    const isUserExist = getAllFeed.totalLike.some(
      (item) => item.userId === userId
    );

    if (isUserExist) {
      const removelikefeed = await Activity.findByIdAndUpdate(
        { _id: feedId },
        {
          $pull: {
            totalLike: { userId: userId },
          },
        },
        {
          new: true,
        }
      );
      return "Feed Unlike";
    } else {
      const likefeed = await Activity.findOneAndUpdate(
        { _id: feedId },
        {
          $push: {
            totalLike: { userId: userId },
          },
        },
        {
          new: true,
        }
      );
      return "Feed like";
    }
  } catch (error) {
    throw error;
  }
}

async function feedComment(auth_token, comment, feedId) {
  try {
    const isUserValid = await ValidUser(auth_token);
    if (isUserValid === true) {
      const user = await User.findOne({ auth_token: auth_token });

      const newcomment = {
        userId: user._id,
        comment: comment,
        createdAt: new Date(),
      };
      const addUserComment = await Activity.findOneAndUpdate(
        { _id: feedId },
        {
          $push: {
            comments: newcomment,
          },
        },
        {
          new: true,
        }
      );
      return addUserComment;
    }

    return isUserValid;
  } catch (error) {
    throw error;
  }
}

async function getComments(authHeader, feedId) {
  try {
    const auth_token = authHeader.split(" ")[1];
    const isValidUser = await ValidUser(auth_token);
    if (isValidUser === true) {
      const feed = await Activity.findOne({ _id: feedId });
      const commentData = await Promise.all(
        feed.comments.map(async (item) => {
          let user = await User.findById(item.userId);
          return {
            userId: item.userId,
            comment: item.comment,
            userAvatar: user.avatar,
            first_name: user.first_name,
            last_name: user.last_name,
            createdAt: item.createdAt,
          };
        })
      );
      return commentData;
    }
    return isValidUser;
  } catch (error) {
    throw error;
  }
}

async function feedDelete(feedId, authHeader) {
  try {
    const auth_token = authHeader.split(" ")[1];
    const isValidUser = await ValidUser(auth_token);
    if (isValidUser === true) {
      const findUser = await User.findOne({ auth_token: auth_token });
      const feedData = await Activity.findOneAndDelete({
        _id: feedId,
        userId: findUser._id,
      });
      if (!feedData) {
        return " No Such Feed Exist";
      }
      return { message: "Feed Deleted Successfully" };
    } else {
      return isValidUser;
    }
  } catch (error) { }
}

async function feedEdit(body, authHeader, imageFile, mimeType) {
  try {
    const auth_token = authHeader.split(" ")[1];
    const isValidUser = await ValidUser(auth_token);
    if (isValidUser === true) {
      let updatedData = {
        file: imageFile,
        caption: body.caption,
        location: body.location,
        longitude: body.longitude,
        latitude: body.latitude,
        mimeType: mimeType,
        tag: body.tag,
        visibility: body.visibility,
      };
      const feedUpdate = await Activity.findOneAndUpdate(
        { _id: body.postId },
        updatedData,
        { new: true }
      );
      return feedUpdate;
    } else {
      return isValidUser;
    }
  } catch (error) {
    throw error;
  }
}

async function calculateDistance(lat1, lon1, lat2, lon2) {
  const earthRadiusKm = 6371; // Radius of the Earth in kilometers

  function degreesToRadians(degrees) {
    return (degrees * Math.PI) / 180;
  }

  const dLat = degreesToRadians(lat2 - lat1);
  const dLon = degreesToRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(lat1)) *
    Math.cos(degreesToRadians(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = earthRadiusKm * c; // Distance in kilometers
  return distance;
}

async function handledata(data, authUser, visibility) {
  if (visibility === 'Public') {

    const feedData = await Promise.all(
      data?.map(async (item) => {
        const getUser = await User.find({ _id: item.userId });

        const isUserFeedLike = item?.totalLike?.some(
          (like) => like.userId === getUser._id
        );
        // const isUserFriend = await Friend.find({
        //   $or: [
        //     { senderId: item.userId, receiverId: authUser, },
        //     { senderId: authUser, receiverId: item.userId },
        //   ],
        //   action: 'ACCEPTED'
        // });
        // console.log(isUserFriend,'isUserFriend');
        return {
          ...item._doc,
          first_name: getUser[0].first_name,
          last_name: getUser[0].last_name,
          userAvatar: getUser[0].avatar,
          isUserFeedLike: isUserFeedLike,
        };
      })
    );

    return feedData;
  } else {
    const feedData = await Promise.all(
      data?.map(async (item) => {
        const getUser = await User.find({ _id: item.userId });

        const isUserFeedLike = item?.totalLike?.some(
          (like) => like.userId === getUser._id
        );
        let isUserFriend = await Friend.find({
          $or: [
            { senderId: item.userId, receiverId: authUser, },
            { senderId: authUser, receiverId: item.userId },
          ],
          action: 'ACCEPTED'
        });

        if (isUserFriend.length > 0 || authUser == item.userId) {
          return {
            ...item._doc,
            first_name: getUser[0].first_name,
            last_name: getUser[0].last_name,
            userAvatar: getUser[0].avatar,
            isUserFeedLike: isUserFeedLike,
          };
        }

      })
    );
    const finalFeeds = feedData.filter(item => item !== undefined)
    return finalFeeds;
  }

}

async function getFilterPost(
  authHeader,
  visibility = "Public",
  distance,
  longitude,
  latitude,
  location,
  tag
) {

  try {
    let authUser;
    if (authHeader) {
      const auth_token = authHeader.split(" ")[1];
      if (auth_token) {
        const isValidUser = await ValidUser(auth_token);
        if (isValidUser === true) {
          const getUser = await User.findOne({ auth_token: auth_token });
          authUser = getUser._id
        }
      }
    }
    let feeds;
    if (location || tag || visibility) {
      const escapedLocation = location?.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      feeds = await Activity.find({
        $and: [
          { location: { $regex: new RegExp(escapedLocation, "i") } },
          { tag: { $regex: new RegExp(tag, "i") } },
          { visibility: visibility },
        ],
      });
    } else {
      feeds = await Activity.find({ visibility: visibility });
    }


    if (distance) {
      const data = await Promise.all(
        feeds.map(async (feed) => {
          const postDistance = await calculateDistance(
            latitude,
            longitude,
            feed.latitude,
            feed.longitude
          );
          return { post: feed, postDistance: postDistance };
        })
      );
      const postsWithinDistance = data
        .filter((post) => post.postDistance <= distance)
        .map((post) => post.post);

      const feedData = await handledata(postsWithinDistance, authUser, visibility);
      const allfeeds = feedData.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      return { feeds: allfeeds };
    }

    const feedData = await handledata(feeds, authUser, visibility);
    const allfeeds = feedData.sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    return { feeds: allfeeds };
  } catch (error) {
    console.log(error, "errrorrrrrr======================");
    throw error;
  }
}


module.exports = { createNewFeed, getFilterPost, handledata, calculateDistance, feedEdit, feedDelete, getComments, feedComment, feedLike, getAllFeed }