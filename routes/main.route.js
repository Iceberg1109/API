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
router.post('/user/reset', (req, res, next) => {
  UserController.resetUserPwd(req, res);
});

// Product related routes
// add new product to the shopify store
router.post('/product/add', (req, res, next) => {
  console.log("product add here");
  ProductController.addProduct(req, res);
});

module.exports = router;