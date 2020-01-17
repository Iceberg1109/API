var bcrypt = require('bcrypt');
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
  resetUserPwd: async function(req, res) {
    var old_pwd = req.body.old_pwd;
    var new_pwd = req.body.new_pwd;
    const hash = await bcrypt.hash(new_pwd, 10);
    
    var user = await UserModel.update({_id:req.user._id}, {password: hash}, function(err, doc) {
      if (err) return res.json({status : 'failed'});
      return res.json({status : 'success'});
    });
    // var user = await UserModel.findById(req.user._id);
    // const validate = await user.isValidPassword(old_pwd);
    // if( !validate ){
    //   console.log("wrong pwd");
      
    // }
    // //Send the user information to the next middleware
    // user.password = "123";
    // user.resetPasswordToken = "token";
    // user.update();
    
  }
}