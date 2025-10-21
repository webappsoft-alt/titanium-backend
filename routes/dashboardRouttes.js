const express = require("express");
const router = express.Router();
const controllers = require("../controllers/dashboardController");
const admin = require('../middleware/admin')

router.get("/count", controllers.getCount);

module.exports = router;
