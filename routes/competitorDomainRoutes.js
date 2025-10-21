const express = require('express');
const router = express.Router();
const controller = require('../controllers/CompetitorDomainController');
const auth = require('../middleware/auth')
const admin = require('../middleware/admin')

router.post('/create', [auth, admin], controller.create);
router.get('/admin/:id', [auth, admin], controller.getAll);
router.get('/all', [auth, admin], controller.getAllData);
router.get('/byId/:id', [auth, admin], controller.getById);
router.put('/edit/:id', [auth, admin], controller.edit);
router.delete('/:id', [auth, admin], controller.delete_);

module.exports = router;
