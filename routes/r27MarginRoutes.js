const express = require("express");
const router = express.Router();
const controllers = require("../controllers/r27MarginController");
const admin = require('../middleware/admin')
const auth = require('../middleware/auth')

router.post('/create', [auth, admin], controllers.create);
router.put('/edit/:id', [auth, admin], controllers.edit_);
router.get('/', controllers.getAll);
router.get('/by-range', controllers.getByValue);
// router.get('/:id', controllers.getById);
router.delete('/', [auth, admin], controllers.delete_);

module.exports = router;
