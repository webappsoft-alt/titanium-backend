const express = require("express");
const router = express.Router();
const controller = require("../controllers/discountedProduct");
const admin = require('../middleware/admin')
const middlewareAuth = require('../middleware/auth')

router.get("/all/:id", controller.getAll);
router.get("/byId/:id", controller.getById);
router.get("/", controller.getProductName);
router.get("/filter", controller.getFilter);
router.get("/data", [middlewareAuth, admin], controller.getSelectedProducts);
// router.get('/alloy-family', controller.getUniqueAlloyFamilies);
// router.get('/byName', middlewareAuth, controller.getByNames);

module.exports = router;
