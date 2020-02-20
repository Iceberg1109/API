const express = require('express');
const router = express.Router();

const ProductController = require('../controller/product.controller');
const UserController = require('../controller/user.controller');

// All routes here are secure, they all require authorization

// User related routes
// Return the user's info
router.post('/user/info', (req, res, next) => {
  UserController.getUserInfo(req, res);
});

router.post('/user/imported', (req, res, next) => {
  UserController.getImportedProducts(req, res);
});

router.post('/user/imported/edit', (req, res, next) => {
  UserController.editImportedProduct(req, res);
});

router.post('/user/my-products', (req, res, next) => {
  UserController.getMyProducts(req, res);
});

router.post('/user/reset-pwd', (req, res, next) => {
  UserController.resetUserPwd(req, res);
});

router.post('/user/addhook', (req, res, next) => {
  UserController.addWebhook(req, res);
});

router.post('/user/set-rule', (req, res, next) => {
  UserController.setPriceRule(req, res);
});

router.post('/user/set-sale-rule', (req, res, next) => {
  UserController.setSalePriceRule(req, res);
});

// Product related routes
router.post('/product/listAll', (req, res, next) => {
  ProductController.getSelfProducts(req, res);
});
router.post('/product/category', (req, res, next) => {
  ProductController.getByCategory(req, res);
});
router.post('/product/listSale', (req, res, next) => {
  ProductController.getSaleProducts(req, res);
});
router.post('/product/listTop', (req, res, next) => {
  ProductController.getTopSellingProducts(req, res);
});
router.post('/ali_product/info', (req, res, next) => {
  ProductController.getAliProductInfo(req, res);
});
router.post('/product/import', (req, res, next) => { // import new product
  ProductController.importProduct(req, res);
});
router.post('/product/add2store', (req, res, next) => { // add new product to the shopify store
  ProductController.addProduct2Store(req, res);
});
router.post('/product/buy', (req, res, next) => { // start buying process
  ProductController.startPayment(req, res);
});
router.post('/product/buy-success', (req, res) => { // execute payment
  ProductController.executePayment(req, res);
});

module.exports = router;