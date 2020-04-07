const passport = require('passport');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const UserModel = require('../model/user.model');
var async = require('async');

var  hbs = require('nodemailer-express-handlebars');
var crypto = require('crypto');

module.exports = {
  /*
  *  Login
  */
  login: async function (req, res, next) {
    // Use passport to login
    passport.authenticate('login', async (err, user, info) => {
      try {
        if(err){
          const error = new Error('An Error occured');
          return next(error);
        }
        if(!user) {
          return res.json({status: "no user"});
        }
        req.login(user, { session : false }, async (error) => {
          if( error ) {
            return next(error);
          }
          //We don't want to store the sensitive information such as the
          //user password in the token so we pick only the email and id
          const body = { _id : user._id, email : user.email, isAdmin: user.isAdmin };
          //Sign the JWT token and populate the payload with the user email and id
          const token = jwt.sign({ user : body },'top_secret');
          //Send back the token to the user
          return res.json({status: "success", token });
        });
      } catch (error) {
        return next(error);
      }
    })(req, res, next);
  },
  /*
  *  Forogot password
  */
  forgotPwd: function (req, res) {
    var MAIL_USERNAME = process.env.MAIL_USERNAME;
    var MAIL_PASSWORD= process.env.MAIL_PASSWORD;

    // Send reset email to the user
    async.waterfall([
      function (done) {
        crypto.randomBytes(20, function (err, buf) {
          var token = buf.toString('hex');
          done(err, token);
        });
      },
      function (token, done) {
        UserModel.findOne({
          email: req.body.email
        }, function (err, user) {
          if (!user) {
            return res.json({status: "no user"});
          }
          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

          user.save().then((doc) => {
            done(null, token, doc);
          })
        });
      },
      function (token, user, done) {
        var handlebarsOptions = {
          viewEngine: {
            extName: '.html',
            partialsDir: '/templates/',
            layoutsDir: '/templates/',
          },
          viewPath: '/templates/',
        };

        var smtpTransport = nodemailer.createTransport({
          host: 'smtp.mailtrap.io',
          port: 2525,
          // secure: true, // use SSL
          auth: {
            user: MAIL_USERNAME,
            pass: MAIL_PASSWORD
          }
        });
        smtpTransport.use('compile', hbs(handlebarsOptions));
        var mailOptions = {
          to: user.email,
          from: "support@udsdropshipping.com",
          subject: 'Password help has arrived!',
          html: '<h4><b>Reset Password</b></h4>' +
          '<p>To reset your password, complete this form:</p>' +
          '<a href=' + process.env.FRONT_URL + '/reset-password/' + token + '>' + "Reset Password" + '</a>' +
          '<br><br>' +
          '<p>UDS Support Team</p>'
        };
        smtpTransport.sendMail(mailOptions, function (err, info) {
          if (!err) return res.json({ message: 'success' });
          else return done(err);
        });
      }
    ], function (err) {
      return res.json({ message: "failed", error: err });
    });
  },
  /*
  *  Reset password
  */
  resetPwd: function(req, res) {
    var password = req.body.password;
    async.waterfall([
      function (done) {
        UserModel.findOne({
          resetPasswordToken: req.body.token,
          resetPasswordExpires: {
            $gt: Date.now()
          }
        }, function (err, user) {
          if (user == null) {
            return res.json({status: "no user"});
          }
          
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