const express = require("express");
const router = express.Router();
const controllers = require("../controllers/pricesController");
const admin = require('../middleware/admin')

router.get("/admin", controllers.getPrice);
router.get("/discounted", controllers.getDiscounted);

module.exports = router;
