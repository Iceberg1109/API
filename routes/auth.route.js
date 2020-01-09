const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const router = express.Router();

const AuthController = require('../controller/auth.controller');
//When the user sends a post request to this route, passport authenticates the user based on the
//middleware created previously
router.post('/signup', passport.authenticate('signup', { session : false }) , async (req, res, next) => {
  res.json({ 
    status: req.user,
  });  
});

router.post('/login', async (req, res, next) => {
  await AuthController.login(req, res, next);
});

router.post('/forgot-pwd', async (req, res, next) => {
  AuthController.forgotPwd(req, res, next);
});

router.post('/reset-pwd/:token', (req, res) => {
  console.log('route', req.body, req.params.token);
  AuthController.resetPwd(req, res);
});
module.exports = router;