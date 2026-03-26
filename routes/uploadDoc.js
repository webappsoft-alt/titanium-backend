require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const mime = require('mime-types');
const fs = require('fs');

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_APIKEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
});

// Setup multer storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadPath = path.join(__dirname, "/files");
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/\s+/g, '_');
    const filename = `${timestamp}_${originalName}`;
    cb(null, filename);
  },
});

const upload = multer({ storage: storage });

router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    const file = req.file;
    const key = file.filename;

    const fileContent = fs.readFileSync(file.path);
    const contentType = mime.lookup(file.path) || 'application/octet-stream';

    // Upload to S3
    const putCommand = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: fileContent,
      ContentType: contentType,
    });

    await s3Client.send(putCommand);

    // Build public URL
    const publicUrl = `${process.env.S3_PUBLIC_URL}/${key}`;

    res.json({ doc: publicUrl });

    // Delete local file after upload
    fs.unlink(file.path, (err) => { if (err) console.error(err); });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Error in uploading. Try again later.', error });
  }
});

module.exports = router;
