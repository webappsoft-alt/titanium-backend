const express = require("express");
const router = express.Router();
const controllers = require("../controllers/toleranceController");
const admin = require('../middleware/admin')

router.get("/admin", controllers.getTolerance);
router.post("/byIds", controllers.getMultipleTolerances);

module.exports = router;
