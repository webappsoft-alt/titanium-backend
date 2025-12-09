const express = require("express");
const router = express.Router();
const controller = require("../controllers/productController");
const admin = require('../middleware/admin')
const middlewareAuth = require('../middleware/auth')

router.post("/create", [middlewareAuth, admin], controller.create);
router.get("/admin/:id", [middlewareAuth, admin], controller.getAll);
router.get("/byId/:id", controller.getById);
router.put("/:id", [middlewareAuth, admin], controller.update);
router.get('/alloy-family', controller.getUniqueAlloyFamilies);
router.get('/byName', middlewareAuth, controller.getByNames);
router.get('/product-form', controller.getByNames);
router.get('/header', controller.getNavHeader);
router.delete("/:id", [middlewareAuth, admin], controller.delete_);

module.exports = router;
