const express = require("express");
const router = express.Router();
const controller = require("../controllers/paytrace");
const admin = require('../middleware/admin')
const authUser = require('../middleware/auth')

router.post("/create", controller.create);

module.exports = router;
