const UserModel = require('../model/user.model');

module.exports = {
  getUserInfo: function (req, res, next) {

    UserModel.findById(req.user._id, 'name email', function (err, user) {
      if (err) return res.json({status: "no user"});
      console.log("get", user);
      return res.json({
        name: user.name,
        email: user.email,
      });
    });
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