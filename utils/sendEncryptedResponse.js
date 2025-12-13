const crypto = require('crypto');
const NodeRSA = require('node-rsa');
const fs = require('fs');

const publicKeyStr = fs.readFileSync('./public.key', 'utf-8');
const publicKey = new NodeRSA(publicKeyStr);
publicKey.setOptions({ encryptionScheme: 'pkcs1' }); // Important: match jsencrypt

const sendEncryptedResponse = (res, data, statusCode = 200) => {
  try {
    const jsonData = JSON.stringify(data);

    // Generate a random AES key
    const aesKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv('aes-256-cbc', aesKey, iv);
    let encryptedData = cipher.update(jsonData, 'utf8', 'base64');
    encryptedData += cipher.final('base64');

    // Encrypt AES key using RSA
    const encryptedKey = publicKey.encrypt(aesKey.toString('base64'), 'base64');

    res.status(statusCode).json({
      encryptedKey,
      iv: iv.toString('base64'),
      data: encryptedData,
    });
  } catch (err) {
    console.error("Encryption failed:", err);
    res.status(500).json({ error: 'Encryption failed' });
  }
};

module.exports = sendEncryptedResponse;
