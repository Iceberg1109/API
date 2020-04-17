const fetch = require("node-fetch");

const ProductModel = require('../model/product.model');
const OrderModel = require('../model/order.model');
const UserModel = require('../model/user.model');

/*
*  This function is for order related requests,
*    @param orders: the orders to be sent the front end
*    @param res: the res variable from the request
*/
sendOrders = async (orders, res) => {
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
    var user = await UserModel.findOne({email: orders[i].client.email});
    
    let product = user.myProducts.find(x => x.id === ("self-" + orders[i].product_id));
    let variant = product.variants.find(x => x.sku === orders[i].sku);
    
    order_list.push ({
      id: orders[i]._id,
      client: orders[i].client,
      quantity: orders[i].quantity,
      product_id: orders[i].product_id,
      sku: orders[i].sku,
      status: orders[i].status,
      shippingAddress: orders[i].shippingAddress,
      price:  orders[i].price,
      variant: {
        title: product.title,
        image: variant.imageSrc ? variant.imageSrc : product.images[0].src
      }
    });
  }

  return res.json({
    status: "success",
    data: {
      orders: order_list
    }
  });
}

module.exports = {
  /*
  *  Send orders according to each user
  *    @param req: the request that has the parameters from the front end
  *    @param res
  */
  getUsersList: async function (req, res) {
    // Find the users from the database
    UserModel.find({isAdmin: false}, async function(err, users) {
      if (err) { // Database error
        return res.json({
          status: "failure",
          error: {
            message: "Error while finding on database"
          }
        });
      }
      
      // List the orders by users
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

      // Respond to front end
      return res.json({
        status: "success", 
        data: {
          users: user_list
        }
      });  
    });
  },
  /*
   * Get the detail of an aliexpress product
  */
  addAliProduct: async function (req, res) {
    var product_id = req.body.product_id;
    console.log("here", product_id);
    
    const response = await fetch(
      `http://api.onebound.cn/aliexpress/api_call.php?num_iid=${product_id}&api_name=item_get&lang=en&key=tel13823615529&secret=20200310`,
      {
        method: "GET",
      }
    );
    const {item} = await response.json();
    
    // Product Title
    product_title = item.title.split("| |  - AliExpress")[0];
    // Product Images
    product_images = [];
    var imgs = item.item_imgs.item_img ? item.item_imgs.item_img : item.item_imgs;
    for (var i = 0; i < imgs.length; i ++) {
      product_images.push({src: imgs[i].url});
    }
    // Product variant options
    var options = new Set();
    for (let [key, value] of Object.entries(item.props_list)) {
      var option = value.split(":")[0];
      options.add(option);
    }

    var product_options = Array.from(options.values());
    // Product variants
    var variants = [];
    for (i = 0; i < item.skus.sku.length; i ++) {
      var options = [];

      var _options = item.skus.sku[i].properties_name.split(":;");
      for (j = 0; j < _options.length; j ++) {
        var temp = _options[j].split("#");

        if (temp.length > 1) options.push(temp[1].split(":")[0]);
        else options.push(temp[0].split(":").pop());
      }
      var price = item.skus.sku[i].price;
      var inventoryQuantity = item.skus.sku[i].quantity;
      variants.push({options, price, inventoryQuantity});
    }

    // Add the product to product list
    var product_details = {
      category: "aliexpress",
      title: product_title,
      descriptionHtml: item.desc,
      images: product_images,
      options: product_options,
      variants:  variants,
      onSale: false,
      importedCount: 0,
      addedCount: 0,
      soldCount: 0
    };
    console.log(product_details)
    // Add product to the database
    var product = await ProductModel.create(product_details);
    return res.json({status : 'success'});
  },
  /*
  *  Add the self product to products' database
  *    @param req: the request that has the parameters from the front end
  *    @param res
  */
  addProduct: async function (req, res) {
    // Get the product details from req
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
    }

    // Assign sku to each variant
    var product = await ProductModel.create(product_details);
    for (var idx = 0; idx < product_details.variants.length; idx ++ ) {
      product_details.variants[idx].sku = product._id + "-" + product_details.variants[idx].options.join('-');
    }

    // Add product to the database
    await ProductModel.updateOne({_id:product._id}, product_details, function(err, doc) {
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
  /*
  *  Add the self product to products' database
  *    @param req
  *    @param res
  */
  editProduct: async function (req, res) {
    console.log("editProduct")
    // Get the product id and details from req
    var product_id = req.body.id;
    console.log(product_id)
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

    // Update the correponding product from database
    await ProductModel.updateOne({_id:product_id}, product_details, function(err, doc) {
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
  /*
  *  Remove the self product from products' database
  *    @param req
  *    @param res
  */
  removeProduct: async function (req, res) {
    /*
    *  req contains the product id
    *  remove the corresponding product from the database
    */
    const response = await ProductModel.deleteOne({ _id: req.body.id });
    if (response.deletedCount) {
      return res.json({status: "success"});
    }
    return res.json({status: "failure"});
  },
  /*
  *  Get all kind of orders
  *    @param req
  *    @param res
  */
  getOrdersList: async function (req, res) {
    // Get the all orders from the database
    var orders = await OrderModel.find({});

    // Send the orders to front end
    sendOrders(orders, res);
  },
  /*
  *  Get delivered orders
  *    @param req
  *    @param res
  */
  getShippedOrders: async function (req, res) {
    // Get the delivered orders from the database
    var orders = await OrderModel.find({status: "shipped"});
    
    // Send the orders to front end
    sendOrders(orders, res);
  },
  /*
  *  Get processed orders
  *    @param req
  *    @param res
  */
  getProcessedOrders: async function (req, res) {
    // Get the processed orders from the database
    var orders = await OrderModel.find({status: "processed"});
    
    // Send the orders to front end
    sendOrders(orders, res);
  },
  /*
  *  Get unprocessed orders
  *    @param req
  *    @param res
  */
  getUnprocessedOrders: async function (req, res) {
    // Get the unprocessed orders from the database
    var orders = await OrderModel.find({status: "pending"});
    
    // Send the orders to front end
    sendOrders(orders, res);
  },
  /*
  *  Get orders of each user
  *    @param req
  *    @param res
  */
  getOrdersbyUser: async function (req, res) {
    // Get  all the users list, that is not admin
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
      var orders = await OrderModel.find({"client.email": users[uidx].email});
      
      var order_list = [];
      
      for(var order_idx = 0; order_idx < orders.length; order_idx ++) {
        var isShipped = "Undelivered";
        if (orders[order_idx].isShipped) isShipped = "Delivered";

        let product = users[uidx].myProducts.find(x => x.id === ("self-" + orders[order_idx].product_id));
        let variant = product.variants.find(x => x.sku === orders[order_idx].sku);
        
        order_list.push ({
          id: orders[order_idx]._id,
          client: orders[order_idx].client,
          quantity: orders[order_idx].quantity,
          product_id: orders[order_idx].product_id,
          sku: orders[order_idx].sku,
          status: orders[order_idx].status,
          shippingAddress: orders[order_idx].shippingAddress,
          price:  orders[order_idx].price,
          variant: {
            title: product.title,
            image: variant.imageSrc ? variant.imageSrc : product.images[0].src
          }
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