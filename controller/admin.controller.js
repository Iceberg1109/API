const UserModel = require('../model/user.model');

module.exports = {
    getUsersList: function (req, res) {
      UserModel.find({isAdmin: false}, 'name email', function(err, users) {
        if (err) res.json({status: "fail"});  
        var userMap = {};
        
        var idx = 0;
        users.forEach(function(user) {
          userMap[idx] = {user};
          idx ++;
        });
    
        res.json({status: "success",count: idx, users: userMap});  
      });
  },

}