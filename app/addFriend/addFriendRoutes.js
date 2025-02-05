const express = require("express");
const { addFriend } = require("./addFriendController");


const router = express.Router();


router.post("/friendupdate", handleAddFriend);


async function handleAddFriend(req, res) {
    try {

        const { receiverId, action } = req.body;
        const authHeader = req.headers["authorization"];
        const reqFriend = await addFriend(authHeader, receiverId, action);
        if (reqFriend && typeof reqFriend === "object") {
            res.status(200).json({ data: reqFriend, success: true })
        } else {
            res.status(400).json({ message: reqFriend, success: false })
        }
    } catch (error) {
        res.status(400).json({ message: "Something went wrong", success: false })
    }
}


module.exports = router;
