// All routes here are secure, they all require authorization

const express = require('express');
const router = express.Router();

const AdminController = require('../controller/admin.controller');

checkIsAdmin = (user, res)  => {
  if (user.isAdmin == false) {
    return res.json({
      status: "failure",
      error: {
        message: "Not allowed"
      }
    });
  }  
}
// Users related routes
router.post('/users/list', (req, res, next) => { // Send all users' list
  checkIsAdmin(req.user, res);
  
  AdminController.getUsersList(req, res);
});

// Products related routes
router.post('/product/add', (req, res, next) => { // Add Product to the database
  checkIsAdmin(req.user, res);

  AdminController.addProduct(req, res);
});

router.post('/product/edit', (req, res, next) => { // Add Product to the database
  checkIsAdmin(req.user, res);

  AdminController.editProduct(req, res);
});

router.post('/product/remove', (req, res, next) => { // Add Product to the database
  checkIsAdmin(req.user, res);

  AdminController.removeProduct(req, res);
});
// Order related routes
router.post('/orders/listAll', (req, res) => { // Add Product to the database
  checkIsAdmin(req.user, res);

  AdminController.getOrdersList(req, res);
});

router.post('/orders/listAll', (req, res) => { // Add Product to the database
  checkIsAdmin(req.user, res);

  AdminController.getOrdersList(req, res);
});

router.post('/orders/listShipped', (req, res) => { // Add Product to the database
  checkIsAdmin(req.user, res);

  AdminController.getShippedOrders(req, res);
});

router.post('/orders/listProcessed', (req, res) => { // Add Product to the database
  checkIsAdmin(req.user, res);

  AdminController.getProcessedOrders(req, res);
});

router.post('/orders/listUnprocessed', (req, res) => { // Add Product to the database
  checkIsAdmin(req.user, res);

  AdminController.getUnprocessedOrders(req, res);
});

router.post('/orders/listbyUser', (req, res) => { // Add Product to the database
  checkIsAdmin(req.user, res);

  AdminController.getOrdersbyUser(req, res);
});

module.exports = router;