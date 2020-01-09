const passport = require('passport');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const UserModel = require('../model/user.model');
var async = require('async');
const config = require('../config/config');
var  hbs = require('nodemailer-express-handlebars');
var crypto = require('crypto');

module.exports = {
  login: async function (req, res, next) {
    passport.authenticate('login', async (err, user, info) => {
      try {
        if(err){
          const error = new Error('An Error occured');
          console.log("auth controller", error);
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
          const body = { _id : user._id, email : user.email };
          //Sign the JWT token and populate the payload with the user email and id
          const token = jwt.sign({ user : body },'top_secret');
          //Send back the token to the user
          return res.json({status: "success", toeken: token });
        });
      } catch (error) {
        return next(error);
      }
    })(req, res, next);
  },
  forgotPwd: function (req, res) {
    var auth_email = config.email.auth_email();
    var auth_email_pwd= config.email.auth_password();

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
          host: 'smtp.gmail.com',
          port: 465,
          secure: true, // use SSL
          auth: {
            user: auth_email,
            pass: auth_email_pwd
          }
        });
        smtpTransport.use('compile', hbs(handlebarsOptions));
        var mailOptions = {
          to: user.email,
          from: "email@a.com",
          subject: 'Password help has arrived!',
          html: '<h4><b>Reset Password</b></h4>' +
          '<p>To reset your password, complete this form:</p>' +
          '<a href=' + config.front_url + '/auth/reset/' + token + '">' + "Reset Password" + '</a>' +
          '<br><br>' +
          '<p>--Team</p>'
        };
        smtpTransport.sendMail(mailOptions, function (err, info) {
          // console.log('sendMail', err, info);
          if (!err) return res.json({ message: 'success' });
          else return done(err);
        });
      }
    ], function (err) {
      return res.json({ message: "failed", error: err });
    });
  },
  resetPwd: function(req, res) {
    console.log('reset-password', req.body, req.params.token);
    var password = req.body.password;
    async.waterfall([
      function (done) {
        UserModel.findOne({
          resetPasswordToken: req.params.token,
          resetPasswordExpires: {
            $gt: Date.now()
          }
        }, function (err, user) {
          console.log(err, user)
          if (user == null) {
            return res.json({status: "no user"});
          }
          console.log('reset password', user);
          var salt = bcrypt.genSaltSync(saltRounds);
          var hash = bcrypt.hashSync(password, salt);
          user.password = hash;
          user.resetPasswordToken = undefined;
          user.resetPasswordExpires = undefined;
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