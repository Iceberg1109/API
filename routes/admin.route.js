const express = require('express');
const router = express.Router();

const AdminController = require('../controller/admin.controller');

// All routes here are secure, they all require authorization

// Users related routes
router.post('/users/list', (req, res, next) => { // Send all users' list
  if (req.user.isAdmin == false) res.json({status: "not allowed"});
  
  AdminController.getUsersList(req, res);
});

// Products related routes
router.post('/product/add', (req, res, next) => { // Add Product to the database
  if (req.user.isAdmin == false) return res.json({status: "not allowed"});

  AdminController.addProduct(req, res);
});

module.exports = router;