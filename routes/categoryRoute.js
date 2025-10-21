const express = require("express");
const router = express.Router();
const controller = require("../controllers/categoryController");
const admin = require('../middleware/admin')
const authUser = require('../middleware/auth')

router.post("/", [authUser, admin], controller.create_);
router.get("/all", controller.getAll);
router.get("/byId/:id", controller.getById);

module.exports = router;
