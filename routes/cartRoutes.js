const express = require("express");
const router = express.Router();
const controller = require("../controllers/cartController");
const admin = require('../middleware/admin')
const authUser = require('../middleware/auth')

router.post("/create", authUser, controller.createCart);
router.get("/all", authUser, controller.getCarts);
router.get("/check/item", authUser, controller.updateCartAndQuote);
router.get("/:id", authUser, controller.getCartById);
router.put("/edit/:id", authUser, controller.updateCart);
router.delete("/:id", authUser, controller.deleteCart);

module.exports = router;
