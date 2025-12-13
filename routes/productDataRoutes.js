const express = require("express");
const router = express.Router();
const controller = require("../controllers/productsDataController");
const admin = require('../middleware/admin')
const middlewareAuth = require('../middleware/auth')

router.post("/create", [middlewareAuth, admin], controller.create);
router.get("/all/:id", controller.getAll);
router.put("/edit/:id", controller.edit_);
router.delete("/:id", controller.delete_);
router.get("/header", controller.getNavHeader);

router.get("/byId/:id", controller.getById);
router.get("/seo/:id", controller.getSeoById);
router.get("/seo-header", controller.getSeoNavHeader);
module.exports = router;
