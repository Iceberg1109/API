/*
*  All routes here are secure, they all require authorization 
*/
const express = require('express');
const router = express.Router();

const ProductController = require('../controller/product.controller');
const UserController = require('../controller/user.controller');
const OrderController = require('../controller/order.controller');

// User related routes

router.post('/user/info', (req, res, next) => { // Return the user's info
  UserController.getUserInfo(req, res);
});

router.post('/user/imported', (req, res, next) => { // Return the imported products of the user
  UserController.getImportedProducts(req, res);
});

router.post('/user/imported/edit', (req, res, next) => { // Edit the imported products of the user
  UserController.editImportedProduct(req, res);
});

router.post('/user/imported/remove', (req, res, next) => { // Remove the imported products of the user
  UserController.removeImportedProduct(req, res);
});

router.post('/user/my-products', (req, res, next) => { // Get the store added products of the user
  UserController.getMyProducts(req, res);
});

router.post('/user/reset-pwd', (req, res, next) => { // Reset the user's password
  UserController.resetUserPwd(req, res);
});

router.post('/user/set-rule', (req, res, next) => { // Set the user's price rule
  UserController.setPriceRule(req, res);
});

router.post('/user/set-sale-rule', (req, res, next) => { // Set the user's sale price rule
  UserController.setSalePriceRule(req, res);
});

// Self Product related routes
router.post('/product/listAll', (req, res, next) => { // List all the products
  ProductController.getSelfProducts(req, res);
});
router.post('/product/category', (req, res, next) => { // List all the products according to the category
  ProductController.getByCategory(req, res);
});
router.post('/product/detail', (req, res, next) => { // Get the details of one product
  ProductController.getById(req, res);
});
router.post('/product/listSale', (req, res, next) => { // List products on sale
  ProductController.getSaleProducts(req, res);
});
router.post('/product/listTop', (req, res, next) => { // List hot products
  ProductController.getTopSellingProducts(req, res);
});
router.post('/ali_product/info', (req, res, next) => { // Get details of one aliexpress product
  ProductController.getAliProductInfo(req, res);
});
router.post('/product/import', (req, res, next) => { // import new product
  ProductController.importProduct(req, res);
});
router.post('/product/add2store', (req, res, next) => { // add new product to the shopify store
  ProductController.addProduct2Store(req, res);
});

// Order related
router.post('/order/listAll', (req, res) => { // List the user's all kind of orders
  OrderController.getOrders(req, res);
});
router.post('/order/listProcessed', (req, res) => { // List the user's processed orders
  OrderController.getProcessedOrders(req, res);
});
router.post('/order/listShipped', (req, res) => { // List the user's delivered orders
  OrderController.getShippedOrders(req, res);
});
router.post('/order/listUnprocessed', (req, res) => { // List the user's unprocessed orders
  OrderController.getUnprocessedOrders(req, res);
});
router.post('/order/markasshipped', (req, res) => { // Mark the order as shipped
  OrderController.markAsShipped(req, res);
});
router.post('/order/markasprocessed', (req, res) => { // Mark the order as processed
  OrderController.markAsProcessed(req, res);
});

module.exports = router;