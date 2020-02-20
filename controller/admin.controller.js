const ProductModel = require('../model/product.model');

module.exports = {
  getUsersList: function (req, res) {
    UserModel.find({isAdmin: false}, 'name email', function(err, users) {
      if (err) {
        return res.json({
          status: "failure",
          error: {
            message: "Error while finding on database"
          }
        });
      }
      var userMap = [];
      
      var idx = 0;
      users.forEach(function(user) {
        userMap.push(user);
        idx ++;
      });
  
      return res.json({
        status: "success", 
        data: {
          count: idx,
          users: userMap
        }
      });  
    });
  },
  addProduct: async function (req, res) {
    var product_details = {
      category: req.body.category,
      title: req.body.title,
      descriptionHtml: req.body.descriptionHtml,
      images: req.body.images,
      options: req.body.options,
      variants: req.body.variants,
      importedCount: 0,
      addedCount: 0,
      soldCount: 0
    };

    const user = await ProductModel.create(product_details);
    return res.json({status: "success"});
  },
}