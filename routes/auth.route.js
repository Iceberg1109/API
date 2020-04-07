const express = require('express');
const passport = require('passport');

const router = express.Router();

const AuthController = require('../controller/auth.controller');
/*
*  When the user sends a post request to this route,
*  passport authenticates the user based on the middleware created previously
*/

// Sign up
router.post('/signup', passport.authenticate('signup', { session : false }) , async (req, res, next) => {
  res.json({ 
    status: req.user,
  });  
});

// Log in
router.post('/login', async (req, res, next) => {
  await AuthController.login(req, res, next);
});

// Forgot password
router.post('/forgot-pwd', async (req, res, next) => {
  AuthController.forgotPwd(req, res, next);
});

// Reset password
router.post('/reset-pwd/', (req, res) => {
  AuthController.resetPwd(req, res);
});

module.exports = router;