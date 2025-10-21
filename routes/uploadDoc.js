require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const mime = require('mime-types');
const fs = require('fs');

const admin = require("firebase-admin");
const bucket = admin.storage().bucket();

// Setup multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "/files"); // Adjust the path as needed
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now(); // Get current timestamp
    const extension = mime.extension(file.mimetype); // Get file extension
    const originalName = file.originalname.replace(/\s+/g, '_'); // Replace spaces with underscores
    const filename = `${timestamp}_${originalName}`; // Combine timestamp and original name
    cb(null, filename); // Save the file with this name
  },
});

const upload = multer({ storage: storage });

router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    // Read the uploaded file
    const file = req.file;
    const destination = `uploads/${file.filename}`;

    // Upload the file to Firebase Storage
    await bucket.upload(file.path, {
      destination,
      metadata: {
        contentType: mime.lookup(file.path),
      }
    });

    // Make the file public
    const fileInBucket = bucket.file(destination);
    await fileInBucket.makePublic();

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;

    res.json({ doc: publicUrl });

    // Delete the local file after upload
    fs.unlink(file.path, (err) => { if (err) console.error(err); });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Error in uploading. Try again later.', error });
  }
});

module.exports = router;
