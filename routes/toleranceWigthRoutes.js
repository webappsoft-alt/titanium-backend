const express = require('express');
const router = express.Router();
const toleranceController = require('../controllers/toleranceWeigthController'); // Adjust path
const admin = require('../middleware/admin')
const auth = require('../middleware/auth')
// Bulk create
router.post('/create', [auth, admin], toleranceController.create);

// Get all
router.get('/all/:id', [auth, admin], toleranceController.getAll);

// Get by ID
router.get('/:id', toleranceController.getById);
router.get('/tol/specific', toleranceController.getSelectedToleranceWeigth);

// Update by ID
router.put('/edit/:id', [auth, admin], toleranceController.update);

// Delete by ID
router.delete('/:id', [auth, admin], toleranceController.delete_);

module.exports = router;
