var bcrypt = require('bcrypt');
const UserModel = require('../model/user.model');

module.exports = {
  getUserInfo: function (req, res, next) {
    UserModel.findById(req.user._id, 'name email storeName', function (err, user) {
      if (err) return res.json({status: "no user"});
      console.log("get", user);
      return res.json({
        name: user.name,
        email: user.email,
        storeName: user.storeName
      });
    });
  },
  resetUserPwd: async function(req, res) {
    var old_pwd = req.body.old_pwd;
    var new_pwd = req.body.new_pwd;
    
    var user = await UserModel.findById(req.user._id);
    if( !user ) return res.json({status : 'failed'});

    const validate = await user.isValidPassword(old_pwd);
    if( !validate ){
      console.log("wrong pwd");
      return res.json({status : 'wrong pwd'});
    }

    const hash = await bcrypt.hash(new_pwd, 10);
    
    var user = await UserModel.updateOne({_id:req.user._id}, {password: hash}, function(err, doc) {
      if (err) return res.json({status : 'failed'});
      return res.json({status : 'success'});
    });
  }
}