const express = require('express');
const error = require('../middleware/error');
const middlewareAuth = require('../middleware/auth')
const admin = require('../middleware/admin')
const auth = require('../routes/auth');
const productRoutes = require('../routes/productRoutes')
const productDataRoutes = require('../routes/productDataRoutes')
const users = require('../routes/users');
const docRoutes = require('../routes/uploadDoc');
const imgRoutes = require('../routes/uploadImages');
const mailRoutes = require('../routes/mailSettingRoutes');
const quotationRoutes = require('../routes/quotationRoutes');
const pricesRoutes = require('../routes/pricesRoutes');
const cartRoutes = require('../routes/cartRoutes');
const toleranceRoutes = require('../routes/toleranceRoute');
const territoriesRoutes = require('../routes/territoriesRoute');
const competitorDomainRoutes = require('../routes/competitorDomainRoutes');
const forgotPasswordRoutes = require('../routes/forgotPassword');
const footerStaticPageRoutes = require('../routes/footerStaticPageRoutes');
const dashboardRoutes = require('../routes/dashboardRouttes');
const discountedProdRoutes = require('../routes/discountedProdRoutes');
const supportRoutes = require('../routes/supportRoute');
const countriesRoutes = require('../routes/countriesRoutes');
const densityRoutes = require('../routes/densityRoutes');
const toleranceWeigthRoutes = require('../routes/toleranceWigthRoutes');
const statesRoutes = require('../routes/statesRoute');
const r27MarginRoutes = require('../routes/r27MarginRoutes');
const competitorValueRoutes = require('../routes/competitorValueRoutes');
const addressRoutes = require('../routes/addressesRoutes');
const categoryRoutes = require('../routes/categoryRoute');
const generalContentRoutes = require('../routes/generalContentRoute');
const favoriteProductRoutes = require('../routes/favoriteProductRoutes');
const paytraceRoutes = require('../routes/paytraceRoute');
const fileDetailRoutes = require('../routes/fileDetailRoute');

module.exports = function (app) {
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use('/api/auth', auth);
  app.use('/api/users', users);
  app.use('/api/tolerance', toleranceRoutes);
  app.use('/api/quotation', quotationRoutes);
  app.use('/api/prod-data', productDataRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/support', supportRoutes);
  app.use('/api/dashboard', [middlewareAuth, admin], dashboardRoutes);
  app.use('/api/doc', middlewareAuth, docRoutes);
  app.use('/api/image', imgRoutes);
  app.use('/api/mail-setting', mailRoutes);
  app.use('/api/discounted-prod', discountedProdRoutes);
  app.use('/api/file', [middlewareAuth, admin], fileDetailRoutes);
  app.use('/api/password', forgotPasswordRoutes);
  app.use('/api/product', productRoutes);
  app.use('/api/static-pages', footerStaticPageRoutes);
  app.use('/api/compet-value', competitorValueRoutes);
  app.use('/api/countries', countriesRoutes);
  app.use('/api/density', densityRoutes);
  app.use('/api/tol-weigth', toleranceWeigthRoutes);
  app.use('/api/states', statesRoutes);
  app.use('/api/r27-margin', r27MarginRoutes);
  app.use('/api/category', categoryRoutes);
  // app.use('/api/paytrace', paytraceRoutes);
  app.use('/api/prices', pricesRoutes);
  app.use('/api/territories', territoriesRoutes);
  app.use('/api/competitor', competitorDomainRoutes);
  app.use('/api/address', addressRoutes);
  app.use('/api/content', generalContentRoutes);
  app.use('/api/favorite', favoriteProductRoutes);
  app.use(error);
}