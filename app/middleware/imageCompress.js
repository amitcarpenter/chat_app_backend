const sharp = require("sharp");
const fs = require("fs");


async function compressImage(req, res, next) {
  if (req.file) {
    const fileExtension = req.file.originalname.split(".").pop();
    if (
      fileExtension === "mp4" ||
      fileExtension === "quicktime" ||
      fileExtension === "x-msvideo"
    ) {
      return next(); // Skip compression for video files
    } else {
      const inputFilePath = req.file.path;
      const outputFilePath = inputFilePath.replace(
        `.${fileExtension}`,
        `_2.${fileExtension}`
      );

      try {
        await sharp(inputFilePath).jpeg({ quality: 80 }).toFile(outputFilePath);
        fs.unlinkSync(inputFilePath);
        req.file.path = outputFilePath;
        next();
      } catch (error) {
        return next(error);
      }
    }
  } else {
    next();
  }
}

module.exports = { compressImage }