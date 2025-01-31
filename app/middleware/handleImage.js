const multer = require("multer");
const fs = require("fs");

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "file") {
      const dirpath = "./uploads/feed";
      if (!fs.existsSync(dirpath)) {
        fs.mkdirSync(dirpath, { recursive: true });
      }
      cb(null, dirpath);
    } else if (file.fieldname === "image") {
      let dirpath = "./uploads/chat";
      if (!fs.existsSync(dirpath)) {
        fs.mkdirSync(dirpath, { recursive: true });
      }

      cb(null, dirpath);
    } else if (file.fieldname === "avatar") {
      let dirpath = "./uploads/profile";
      if (!fs.existsSync(dirpath)) {
        fs.mkdirSync(dirpath, { recursive: true });
      }
      cb(null, dirpath);
    }
  },
  filename: function (req, file, cb) {
    // Keep the original file extension
    const ext = file.originalname.split(".").pop();
    cb(null, Date.now() + "." + ext);
  },
});

// Accept both images and videos
const maxSize = 50 * 1024 * 1024;
var upload = multer({
  storage: storage,
  limits: { fileSize: maxSize },
  fileFilter: function (req, file, cb) {
    const allowedImageTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/jpg",
    ];
    const allowedVideoTypes = [
      "video/mp4",
      "video/quicktime",
      "video/x-msvideo",
    ];

    if (
      allowedImageTypes.includes(file.mimetype) ||
      allowedVideoTypes.includes(file.mimetype)
    ) {
      cb(null, true);
    } else {
      cb(new Error("File type not supported!"));
    }
  },
});

module.exports = upload;
