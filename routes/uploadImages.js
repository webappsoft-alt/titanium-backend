require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const mime = require('mime-types');
const fs = require('fs');
const sharp = require('sharp');

const admin = require("firebase-admin");
const bucket = admin.storage().bucket();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "/files"); // Adjust the path as needed
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const extension = mime.extension(file.mimetype);
    const filename = `${timestamp}.${extension}`;
    cb(null, filename);
  },
});

const upload = multer({ storage: storage });

router.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  try {
    // Read the uploaded file
    const file = req.file;
    const destination = `uploads/${file.filename}`;

    // Set paths for compressed file
    const compressedFilePath = path.join(__dirname, 'files', `compressed-${file.filename}`);

    // Compress and resize based on file type
    const image = sharp(file.path).resize({ width: 800 });

    // Preserve transparency if PNG, otherwise convert to JPEG
    if (file.mimetype === 'image/png') {
      await image.png({ quality: 80 }).toFile(compressedFilePath);
    } else {
      await image.jpeg({ quality: 80 }).toFile(compressedFilePath);
    }

    // Upload the compressed file to Firebase Storage
    await bucket.upload(compressedFilePath, {
      destination,
      metadata: {
        contentType: mime.lookup(compressedFilePath),
      }
    });

    // Make the file public
    const fileInBucket = bucket.file(destination);
    await fileInBucket.makePublic();

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;

    res.json({ image: publicUrl });

    // Delete local files after sending response
    fs.unlink(file.path, (err) => { if (err) console.error(err); });
    fs.unlink(compressedFilePath, (err) => { if (err) console.error(err); });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Error in uploading. Try again later.', error });
  }
});

module.exports = router;
