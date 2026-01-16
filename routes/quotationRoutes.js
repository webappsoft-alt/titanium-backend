const express = require('express');
const router = express.Router();
const controller = require('../controllers/quotationController');
const auth = require('../middleware/auth')
const admin = require('../middleware/admin')

router.post('/create', auth, controller.createQuotation);
router.get('/user/:id?', auth, controller.getCustomerQuotations);

router.get('/admin/:id', [auth, admin], controller.getAllQuotations);
router.get('/byId/:id', auth, controller.getQuotationById);

router.get('/byUserId/:id', [auth, admin], controller.getQuotationByUserId);
router.get('/open-quote/:id', auth, controller.getOpenQuotationByUserId);
router.get('/stats', [auth, admin], controller.getQuotationStats);
router.get('/generate-report', [auth, admin], controller.generateExcel);
router.put('/edit/:id', [auth, admin], controller.updateQuotation);
router.put('/status/:id', [auth, admin], controller.updateStatus);

router.post('/finalize-btn/create', auth, controller.createOpenQuotation);
router.put('/finalize-btn/:id', auth, controller.sendOpenQuotationEmail);
router.post('/proceed-to-btn', auth, controller.savePdfAndScheduleEmail);

router.put('/resend/:id/:type', auth, controller.sendQuotationEmail);
router.delete('/:id', [auth, admin], controller.deleteQuotation);

module.exports = router;
