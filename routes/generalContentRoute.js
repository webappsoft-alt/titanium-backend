const express = require("express");
const router = express.Router();
const controller = require("../controllers/generalContentController");
const admin = require('../middleware/admin')
const authUser = require('../middleware/auth')

router.post("/", [authUser, admin], controller.bulkCreateOrUpdate);
router.get("/all", controller.getAll);

module.exports = router;
