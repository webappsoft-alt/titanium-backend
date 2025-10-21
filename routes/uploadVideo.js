require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const mime = require('mime-types');
const fs = require('fs');

const admin = require("firebase-admin");

const bucket = admin.storage().bucket();

// Multer storage configuration for video uploads
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

// Multer configuration to allow video uploads
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['video/mp4', 'video/mov', 'video/avi', 'video/mpeg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only MP4, MOV, AVI, and MPEG formats are allowed.'));
    }
  },
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB file size limit
});

// API route for uploading video files
router.post('/upload', upload.single('video'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No video uploaded.');
  }
  try {    
    const file = req.file;
    const destination = `uploads/${file.filename}`;

    // Upload the video to Firebase Storage
    await bucket.upload(file.path, {
      destination,
      metadata: {
        contentType: file.mimetype, // Set the correct video MIME type
      }
    });
    
    // Make the video public
    const fileInBucket = bucket.file(destination);
    await fileInBucket.makePublic();
    
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;
    
    res.json({ video: publicUrl });

    // Delete the local video file after uploading
    fs.unlink(file.path, (err) => {});
  } catch (error) {
    res.status(400).json({ message: 'Error in uploading video. Try again later.', error });
  }
});

module.exports = router;
