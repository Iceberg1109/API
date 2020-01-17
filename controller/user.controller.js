const passport = require('passport');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const UserModel = require('../model/user.model');
var async = require('async');

var  hbs = require('nodemailer-express-handlebars');
var crypto = require('crypto');
var bcrypt = require('bcrypt');

module.exports = {
  getUserInfo: async function (req, res, next) {
   
  },
  resetPwd: function(req, res) {
    console.log('reset-password', req.body);
    var password = req.body.password;
    async.waterfall([
      function (done) {
        UserModel.findOne({
          resetPasswordToken: req.body.token,
          resetPasswordExpires: {
            $gt: Date.now()
          }
        }, function (err, user) {
          console.log(err, user)
          if (user == null) {
            return res.json({status: "no user"});
          }
          console.log('reset password', user);

          user.password = password;
          user.resetPasswordToken = "";
          user.resetPasswordExpires = null;
          user.save(function (err) {
            if (!err) return res.json({status: "success"});
            return res.json({status: "success"});
          });
        });
      }
    ], function (err) {
      if (err){
        return res.json({ message: "failed", error: err });
      }
    });
  }
}