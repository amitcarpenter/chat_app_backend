const express = require("express");
const {
  userRegisterController,
  authUpdateToken,
  getAllUsers,
  getuserProfile,
  updateUserProfile,
  getSecondUserProfile,
  getRequestList,
} = require("./userController");

const upload = require("../middleware/handleImage");
const { compressImage } = require("../middleware/imageCompress");

const router = express.Router();

const APP_URL = process.env.APP_URL;

//post routes....
router.post("/register", handleUserRegistration);
router.post("/login", handleAuthUpdate);
router.put("/update", upload.single("avatar"), compressImage, handleProfileUpdate);

//get routes....
router.get("/alluser", handleAllUsers);
router.get("/profile", handleUserProfile);
router.get("/profile/:id", handleSecondUserProfile);
router.get('/request/:action', handleIncomingRequest)


// handle user registeration
async function handleUserRegistration(req, res) {
  try {
    const result = await userRegisterController(req.body);
    if (result && typeof result === "object") {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.user,
      });
    } else {
      res.status(400).json({ success: false, message: result, data: {} });
    }
  } catch (error) {
    res
      .status(400)
      .json({ success: false, message: "Something went wrong", data: {} });
  }
}

// updating user auth token
async function handleAuthUpdate(req, res) {
  try {
    console.log(req.body);

    const result = await authUpdateToken(req.body);
    if (result && typeof result === "object") {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.user,
      });
    } else {
      res.status(400).json({ success: false, message: result, data: {} });
    }
  } catch (error) {
    res
      .status(400)
      .json({ success: false, message: "Something went wrong", data: {} });
  }
}

// update user profile
async function handleProfileUpdate(req, res) {
  let imageFile = "";
  if (req.file) {
    const fileExtension = req.file.originalname.split(".").pop();
    imageFile = `profile/${req.file.filename}`;
    imageFile = imageFile.replace(`.${fileExtension}`, `_2.${fileExtension}`);
  }
  try {
    const updateProfile = await updateUserProfile(
      req.headers,
      req.body,
      imageFile
    );
    if (updateProfile && typeof updateProfile === "object") {
      res.status(200).json({ message: "Profile Updated", success: true });
    } else {
      res.status(400).json({ message: updateProfile, success: false });
    }
  } catch (error) {
    res.status(400).json({ message: "Something went wrong", success: false });
  }
}

// get all user
async function handleAllUsers(req, res) {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(400).json({ message: "Please Provide Auth Token", success: false });
    }
    if (authHeader) {
      const result = await getAllUsers(authHeader);
      if (result && typeof result === "object") {
        return res.status(200).json({
          data: result,
          success: true,
        });
      } else {
        return res.status(400).json({
          message: result,
          success: false,
        });
      }
    }
  } catch (error) {
    return res.status(400).json({ message: "Something went wrong", success: false });
  }
}

// get user profile
async function handleUserProfile(req, res) {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(400).json({ message: "Please Provide Auth Token", success: false });
    }
    if (authHeader) {
      const userProfile = await getuserProfile(authHeader);
      if (userProfile && typeof userProfile === "object") {
        return res
          .status(200)
          .json({ message: "User Details", data: userProfile, success: true });
      } else {
        return res.status(400).json({ message: userProfile, success: false });
      }
    }
  } catch (error) {
    return res.status(400).json({ message: "Something went wrong ", success: false });
  }
}

// get second user profile
async function handleSecondUserProfile(req, res) {
  try {
    const userId = req.params.id;
    const authHeader = req?.headers["authorization"];
    const secondUserProfile = await getSecondUserProfile(authHeader, userId);

    if (secondUserProfile && typeof secondUserProfile === "object") {
      // If profile has an avatar, prepend APP_URL
      if (sortedfeedData[0].file) {
        sortedfeedData[0].file = `${APP_URL}${sortedfeedData[0].file}`;
        console.log(`${APP_URL}${sortedfeedData[0].file}`);
        
      }

      return res.status(200).json({ data: secondUserProfile, success: true });
    } else {
      return res.status(400).json({ message: secondUserProfile, success: false });
    }
  } catch (error) {
    return res.status(400).json({ message: "Something went wrong", success: false });
  }
}

async function handleIncomingRequest(req, res) {
  try {
    const action = req.params.action;
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
      return res.status(400).json({ message: "Please Provide Auth Token", success: false });
    }
    const reqlist = await getRequestList(authHeader, action)
    if (reqlist && typeof reqlist === "object") {
      return res.status(200).json({ data: reqlist, success: true })
    } else {
      return res.status(400).json({ message: reqlist, success: false })
    }
  } catch (error) {
    console.log(error, 'error')
    return res.status(400).json({ message: "Something went Wrong", success: false })
  }
}


module.exports = router;