const express = require("express");
const router = express.Router();
const controller = require("../controllers/addressesController");
const admin = require('../middleware/admin')
const authUser = require('../middleware/auth')

router.post("/import", [authUser, admin], controller.create_);
router.put("/edit/:id", authUser, controller.update);

module.exports = router;
