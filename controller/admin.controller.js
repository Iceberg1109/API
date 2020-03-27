const ProductModel = require('../model/product.model');
const OrderModel = require('../model/order.model');
const UserModel = require('../model/user.model');

module.exports = {
  getUsersList: async function (req, res) {
    UserModel.find({isAdmin: false}, async function(err, users) {
      if (err) {
        return res.json({
          status: "failure",
          error: {
            message: "Error while finding on database"
          }
        });
      }
      
      var user_list = [];
      for(var i = 0; i < users.length; i ++) {
        var orders = await OrderModel.find({storeName: users[i].storeName});
        user_list.push ({
          no: i + 1,
          store: users[i].storeName,
          products_cnt: users[i].myProducts.length,
          email: users[i].email,
          orders_cnt: orders.length,
        });
      }

      return res.json({
        status: "success", 
        data: {
          users: user_list
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
      onSale: req.body.onSale,
      importedCount: 0,
      addedCount: 0,
      soldCount: 0
    };

    const user = await ProductModel.create(product_details);
    return res.json({status: "success"});
  },
  editProduct: async function (req, res) {
    var product_id = req.body.id;
    var product_details = {
      category: req.body.category,
      title: req.body.title,
      descriptionHtml: req.body.descriptionHtml,
      images: req.body.images,
      options: req.body.options,
      variants: req.body.variants,
      onSale: req.body.onSale,
      importedCount: 0,
      addedCount: 0,
      soldCount: 0
    };

    user = await ProductModel.updateOne({_id:product_id}, product_details, function(err, doc) {
      if (err) {
        return res.json({
          status: "failure",
          error: {
            message: json_encode(err)
          }
        });
      }
      return res.json({status : 'success'});
    });
  },
  removeProduct: async function (req, res) {
    const response = await ProductModel.deleteOne({ _id: req.body.id });
    if (response.deletedCount) {
      return res.json({status: "success"});
    }
    return res.json({status: "failure"});
  },
  getOrdersList: async function (req, res) {
    var orders = await OrderModel.find({});
    
    if (orders == null) {
      return res.json({
        status: "failure",
        error: {
          message: "Error while find on database"
        } 
      });
    }

    var order_list = [];
    for(var i = 0; i < orders.length; i ++) {
      var product_type = "Self";
      if (orders[i].type == "ali") product_type = "Aliexpress";
      var isShipped = "Undelivered";
      if (orders[i].isShipped) isShipped = "Delivered";

      var user = await UserModel.findOne({storeName: orders[i].storeName});
      
      var myProducts = user.myProducts;
      var product = myProducts.find(x => x.id === orders[i].product_id);
      var variant = product.variants.find(x => x.sku === orders[i].sku);

      order_list.push ({
        no: i + 1,
        store: orders[i].storeName,
        quantity: orders[i].quantity,
        product_type: product_type,
        image: variant.imageSrc,
        product_name: product.title,
        email: user.email,
        isShipped: isShipped
      });
    }

    return res.json({
      status: "success",
      data: {
        orders: order_list
      }
    });
  },
  getOrdersbyUser: async function (req, res) {
    const users =  await UserModel.find({isAdmin: false})
    if (users == null) {
      return res.json({
        status: "failure",
        error: {
          message: "Error while finding on database"
        }
      });
    }
    
    var user_list = [];
    for(var uidx = 0; uidx < users.length; uidx ++) {
      var orders = await OrderModel.find({storeName: users[uidx].storeName});
      
      var order_list = [];
      
      for(var order_idx = 0; order_idx < orders.length; order_idx ++) {
        var product_type = "Self";
        if (orders[order_idx].type == "ali") product_type = "Aliexpress";
        var isShipped = "Undelivered";
        if (orders[order_idx].isShipped) isShipped = "Delivered";

        var myProducts = users[uidx].myProducts;
        var product = myProducts.find(x => x.id === orders[order_idx].product_id);
        var variant = product.variants.find(x => x.sku === orders[order_idx].sku);

        order_list.push ({
          quantity: orders[order_idx].quantity,
          product_type: product_type,
          image: variant.imageSrc,
          product_name: product.title,
          isShipped: isShipped
        });
      }

      user_list.push ({
        no: uidx + 1,
        store: users[uidx].storeName,
        email: users[uidx].email,
        orders_cnt: orders.length,
        orders: order_list
      });
    }

    return res.json({
      status: "success", 
      data: {
        users: user_list
      }
    });  
  },
}