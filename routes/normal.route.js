const express = require('express');
const router = express.Router();

const OrderController = require('../controller/order.controller');
//When the user sends a post request to this route, passport authenticates the user based on the
//middleware created previously
router.post('/order/created', async (req, res, next) => {
  await OrderController.orderCreated(req, res, next);
});

router.post('/order/paid', async (req, res, next) => {
    await OrderController.orderCreated(req, res, next);
});

router.post('/forgot-pwd', async (req, res, next) => {
  AuthController.forgotPwd(req, res, next);
});

router.post('/reset-pwd/', (req, res) => {
  AuthController.resetPwd(req, res);
});

router.post('/shopify/', (req, res) => {
  AuthController.shopifyAuth(req, res);
});
module.exports = router;