require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const mime = require('mime-types');
const fs = require('fs');
const sharp = require('sharp');

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  region: process.env.S3_REGION,
  endpoint: process.env.S3_CONSOLE_URL,
  credentials: {
    accessKeyId: process.env.S3_APIKEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "/files");
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
    const file = req.file;
    const key = `uploads/${file.filename}`;

    // Set path for compressed file
    const compressedFilePath = path.join(__dirname, 'files', `compressed-${file.filename}`);

    // Compress and resize based on file type
    const image = sharp(file.path).resize({ width: 800 });

    if (file.mimetype === 'image/png') {
      await image.png({ quality: 80 }).toFile(compressedFilePath);
    } else {
      await image.jpeg({ quality: 80 }).toFile(compressedFilePath);
    }

    // Read compressed file
    const fileContent = fs.readFileSync(compressedFilePath);
    const contentType = mime.lookup(compressedFilePath) || 'application/octet-stream';

    // Upload to S3
    const putCommand = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: fileContent,
      ContentType: contentType,
    });

    await s3Client.send(putCommand);

    // Build public URL
    const publicUrl = `${process.env.S3_CONSOLE_URL}/${process.env.S3_BUCKET_NAME}/${key}`;

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
