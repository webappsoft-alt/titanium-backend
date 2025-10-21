const CryptoJS = require('crypto-js');
const dotenv = require('dotenv');

// Load environment variables from a .env file
dotenv.config();

const secret_key = process.env.SECRET_KEY_EN;

// Function to encrypt data
exports.encryptData = (data) => {
    try {
        const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(data), secret_key).toString();
        return encryptedData;
    } catch (error) {
        console.error('Error encrypting data:', error);
    }
};

// Function to decrypt data
exports.decryptData = (data) => {
    try {
        if (data) {
            const bytes = CryptoJS.AES.decrypt(data, secret_key);
            const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
            return decryptedData;
        }
    } catch (error) {
        console.error('Error decrypting data:', error);
    }
    return null;
};