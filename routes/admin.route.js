const express = require('express');
const router = express.Router();

const AdminController = require('../controller/admin.controller');

// All routes here are secure, they all require authorization

// Users related routes
router.post('/users/list', (req, res, next) => { // Send all users' list
  if (req.user.isAdmin == false) {
    return res.json({
      status: "failure",
      error: {
        message: "Not allowed"
      }
    });
  }
  
  AdminController.getUsersList(req, res);
});

// Products related routes
router.post('/product/add', (req, res, next) => { // Add Product to the database
  if (req.user.isAdmin == false) {
    return res.json({
      status: "failure",
      error: {
        message: "Not allowed"
      }
    });
  }

  AdminController.addProduct(req, res);
});

// Order related routes
router.post('/orders/list', (req, res) => { // Add Product to the database
  if (req.user.isAdmin == false) {
    return res.json({
      status: "failure",
      error: {
        message: "Not allowed"
      }
    });
  }

  AdminController.getOrdersList(req, res);
});

router.post('/orders/listbyUser', (req, res) => { // Add Product to the database
  if (req.user.isAdmin == false) {
    return res.json({
      status: "failure",
      error: {
        message: "Not allowed"
      }
    });
  }

  AdminController.getOrdersbyUser(req, res);
});

module.exports = router;