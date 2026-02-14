const express = require('express');
const router = express.Router();
const controller = require('../controllers/forgotPasswordController');
const admin = require('../middleware/admin');
const auth = require('../middleware/otpLinkAuth');
const { passwordResetLimiter } = require('../startup/security');

router.get('/forgot/:userId/:token', passwordResetLimiter, auth, controller.forgotPassword);
// router.post('/reset/:userId/:token', auth, controller.UpdatePassword);

module.exports = router;
