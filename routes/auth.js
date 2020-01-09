const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const router = express.Router();

const AuthController = require('../controller/auth');
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

module.exports = router;