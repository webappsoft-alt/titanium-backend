const express = require('express');
const router = express.Router();
const controller = require('../controllers/footerStaticPageController');
const auth = require('../middleware/auth')
const admin = require('../middleware/admin')

// Define CRUD routes for products
router.post('/create', [auth, admin], controller.create_);
router.get('/all/:type', controller.getAll);
router.get('/admin/:type', controller.getAdmin);
router.get('/byId/:id', controller.getById);
router.put('/edit/:id', [auth, admin], controller.edit_);
router.put('/indexOrder', [auth, admin], controller.updateIndexOrder);
router.delete('/:id', [auth, admin], controller.delete_);

module.exports = router;
