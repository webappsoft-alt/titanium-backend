const express = require("express");
const router = express.Router();
const controller = require("../controllers/favoriteProductController");
const admin = require('../middleware/admin')
const authUser = require('../middleware/auth')

router.post("/add", authUser, controller.create_);
router.get("/", authUser, controller.getByUser);
router.get("/:id", authUser, controller.getById);
router.put("/remove/:id", authUser, controller.remove_);

module.exports = router;
