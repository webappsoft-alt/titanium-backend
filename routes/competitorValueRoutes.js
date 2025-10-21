const express = require('express');
const router = express.Router();
const controller = require('../controllers/competitorValueController');
const auth = require('../middleware/auth')
const admin = require('../middleware/admin')

router.post('/create', [auth, admin], controller.create);
router.get('/admin', [auth, admin], controller.getAll);
router.put('/edit/:id', [auth, admin], controller.edit_);

module.exports = router;
