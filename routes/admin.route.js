const express = require('express');
const router = express.Router();

const AdminController = require('../controller/admin.controller');

// All routes here are secure, they all require authorization

router.post('/users/list', (req, res, next) => {
    if (req.user.isAdmin == false) {
      res.json({status: "not allowed"});
    }
    else {
      AdminController.getUsersList(req, res);
    }
});

module.exports = router;