const express = require("express")
const {
  createNewFeed,
  getAllFeed,
  feedLike,
  feedComment,
  getComments,
  feedDelete,
  feedEdit,
  getFilterPost
} = require("./activityController");

const upload = require("../middleware/handleImage");
const { compressImage } = require("../middleware/imageCompress");
const { ValidUser } = require("../middleware/hanldeValiduser");


const router = express.Router();
router.get("/", handleAllFeed);
router.get('/delete/:feedId', handleFeedDelete)
router.get("/getcomment/:feedId", handleAllComment);


router.post("/likefeed", handleFeedLike);
router.post("/addcomment", handleFeedComment);
router.post('/filter-feed', handleFilterFeed)
router.post("/createnew", upload.single("file"), compressImage, handleNewFeed);
router.post('/edit-feed', upload.single("file"), compressImage, handleFeedEdit)

const APP_URL = process.env.APP_URL
console.log(APP_URL);


async function handleNewFeed(req, res) {
  console.log(req.body);
  console.log(req.file);

  let imageFile = "";
  let mimeType = ""
  if (req.file) {
    const fileExtension = req.file.originalname.split(".").pop();
    if (
      fileExtension === "mp4" ||
      fileExtension === "quicktime" ||
      fileExtension === "x-msvideo"
    ) {
      imageFile = `feed/${req.file.filename}`;
      mimeType = req.file.mimetype
    } else {

      imageFile = `feed/${req.file.filename}`;
      imageFile = imageFile.replace(`.${fileExtension}`, `_2.${fileExtension}`);
      mimeType = req.file.mimetype
    }
  }


  try {
    const { userId, caption, location, longitude, latitude, tag, visibility } = req.body;
    const authHeader = req.headers["authorization"];
    // const auth_token = '12323222';
    const auth_token = authHeader.split(" ")[1];
    const newFeed = await createNewFeed(
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
    );

    if (newFeed && typeof newFeed === "object") {
      return res.status(200).json({ data: newFeed, success: true });
    } else {
      return res.status(400).json({ message: newFeed, success: false });
    }
  } catch (error) {
    // return res.status(400).json({ message: "something went wrong", success: false });
    return res.status(500).json({ success: false, status: 500, message: error.message })
  }
}

async function handleAllFeed(req, res) {
  try {
    const authHeader = req.headers["authorization"];
    const allfeed = await getAllFeed(authHeader);
    if (allfeed && typeof allfeed == "object") {
      const sortfeed = allfeed.sort(

        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      res.status(200).json({ data: sortfeed, success: true });
    } else {
      res.status(400).json({
        message: allfeed,
        success: false,
        data: {},
      });
    }
  } catch (error) {
    console.log(error, 'errror')
    res.status(400).json({ message: "Something went wrong", success: false });
  }
}

async function handleFeedLike(req, res) {
  try {
    const { feedId, userId } = req.body;
    const authHeader = req.headers["authorization"];
    const auth_token = authHeader.split(" ")[1];
    const isValidUser = await ValidUser(auth_token);
    if (isValidUser === true) {
      const feedlike = await feedLike(feedId, userId);
      res.status(200).json({ message: feedlike, success: true });
    } else {
      res.status(400).json({ message: isValidUser, success: false });
    }
  } catch (error) {
    res.status(400).json({ message: "Something went wrong", success: false });
  }
}

async function handleFeedComment(req, res) {
  try {
    const { comment, feedId } = req.body;
    const authHeader = req.headers["authorization"];
    const auth_token = authHeader.split(" ")[1];
    const comments = await feedComment(auth_token, comment, feedId);
    if (comments && typeof comments === "object") {
      res.status(200).json({ message: "Comment Added", success: true });
    } else {
      res.status(400).json({ message: comments, success: false });
    }
  } catch (error) {
    res.status(400).json({ message: "Something went wrong", success: false });
  }
}

async function handleAllComment(req, res) {
  try {
    const feedId = req.params.feedId;

    const authHeader = req.headers["authorization"];
    const allComments = await getComments(authHeader, feedId);
    if (allComments && typeof allComments === "object") {
      res.status(200).json({ data: allComments, success: true });
    } else {
      res.status(400).json({ message: allComments, success: false });
    }
  } catch (error) {
    res.status(400).json({ message: "Something went wrong", success: false });
  }
}

async function handleFeedDelete(req, res) {
  try {
    const feedId = req.params.feedId;

    const authHeader = req.headers["authorization"];
    const feedResult = await feedDelete(feedId, authHeader);
    if (feedResult && typeof feedResult === 'object') {
      res.status(200).json({ data: feedResult, success: true })
    } else {
      res.status(400).json({ message: feedResult, success: false })
    }
  } catch (error) {
    res.status(200).json({ message: "Something went wrong", success: false })
  }
}

async function handleFeedEdit(req, res) {
  try {
    console.log(req.body)
    let imageFile = "";
    let mimeType = ""
    if (req.file) {
      const fileExtension = req.file.originalname.split(".").pop();
      if (
        fileExtension === "mp4" ||
        fileExtension === "quicktime" ||
        fileExtension === "x-msvideo"
      ) {
        imageFile = `feed/${req.file.filename}`;
        mimeType = req.file.mimetype

      } else {

        imageFile = `feed/${req.file.filename}`;
        imageFile = imageFile.replace(`.${fileExtension}`, `_2.${fileExtension}`);
        mimeType = req.file.mimetype

      }
    }
    const authHeader = req.headers["authorization"];
    const feedResult = await feedEdit(req.body, authHeader, imageFile, mimeType);
    if (feedResult && typeof feedResult === 'object') {
      res.status(200).json({ data: feedResult, success: true })
    } else {
      res.status(400).json({ message: feedResult, success: false })
    }
  } catch (error) {
    console.log(error, 'errrooorrrr')
    res.status(400).json({ message: "Something went wrong", success: false })
  }
}


async function handleFilterFeed(req, res) {
  try {
    const { visibility, distance, longitude, latitude, tag, location } = req.body;
    const authHeader = req.headers["authorization"];
    const result = await getFilterPost(authHeader, visibility, distance, longitude, latitude, location, tag)
    console.log(req.body);

    if (!result || !result.feeds || result.feeds.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const final_result = await Promise.all(
      result.feeds.map((feed) => {
        feed.file = APP_URL + feed.file;
        return feed;
      })
    );

    
    let data = { feeds: final_result }

    if (result && typeof result == 'object') {
      return res.status(200).json({ data: data, success: true })
    } else {
      return res.status(200).json({ message: result, success: true })
    }
  } catch (error) {
    return res.status(400).json({ message: "Something Went Wrong", success: false })
  }
}

module.exports = router;