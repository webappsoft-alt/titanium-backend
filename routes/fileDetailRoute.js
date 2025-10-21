// routes/file.routes.js
const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileDetailController');

router.post('/create', fileController.create);
router.get('/all/:id', fileController.getAll); // e.g., /page/1
router.get('/:id', fileController.getById);
router.put('/:id', fileController.update);
router.delete('/:id', fileController.delete_);

module.exports = router;
