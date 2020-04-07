/*
*  All routes here don't require authorization,
*  used for callbacks and password reset
*/
const express = require('express');
const router = express.Router();

const OrderController = require('../controller/order.controller');

router.post('/forgot-pwd', async (req, res, next) => { // Forgot password
  AuthController.forgotPwd(req, res, next);
});

router.post('/reset-pwd/', (req, res) => { // Reset password
  AuthController.resetPwd(req, res);
});

router.post('/shopify/', (req, res) => { // Shopify callback when attaching the store to the user
  AuthController.shopifyAuth(req, res);
});

module.exports = router;