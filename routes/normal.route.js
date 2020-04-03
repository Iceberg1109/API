const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary');
const formidable = require('formidable');

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

router.get('/product/buy-success', (req, res) => { // execute payment
  ProductController.executePayment(req, res);
});

// Image upload
router.post('/image-upload', (req, res) => {
  console.log("path");
  const form = formidable({ multiples: true });
 
  form.parse(req, (err, fields, files) => {
    if (err) {
      next(err);
      return;
    }
    console.log(files);
    const path = Object.values(Object.values(files)[0])[0].path;
    console.log(path);
    cloudinary.uploader.upload(path)
    .then(image => {
      console.log(image);
      return res.json([image]);
    });
  });
});

module.exports = router;