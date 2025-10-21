const express = require('express');
const router = express.Router();
const mailSettingsController = require('../controllers/mailSettingController');
const admin = require('../middleware/admin')
const middlewareAuth = require('../middleware/auth')

router.get('/', [middlewareAuth, admin], mailSettingsController.getMailSettings);
router.post('/create', [middlewareAuth, admin], mailSettingsController.saveMailSettings);

module.exports = router;
