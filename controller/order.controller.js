const crypto = require("crypto");

const UserModel = require('../model/user.model');
const ProductModel = require('../model/product.model');
const OrderModel = require('../model/order.model');

/*
 *  Fill the orders' details from the my products list of the user
*/
getOrderDetails = (user, orders) => {
  var orders_details = [];
  for(let i = 0; i < orders.length; i ++) {
    let product = user.myProducts.find(x => x.id === ("self-" + orders[i].product_id));
    let variant = product.variants.find(x => x.sku === orders[i].sku);
    
    orders_details.push({
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
    })
  }

  return orders_details;
}
module.exports = {
  shopifyOrderCreated: async function(req, res) {
    console.log("shopify order => ", req.body)
    generated_hash = crypto
      // .createHmac('sha256', process.env.SHOPIFY_PARTNER_APISECRET)
      .createHmac('sha256', "146f314814ccaf1ffd014c219b527620dbdf4d338bc9eb43bb4409b0671a2509")
      .update(Buffer.from(req.rawbody))
      .digest('base64');

    if (generated_hash == req.headers['x-shopify-hmac-sha256']) { // Safe Hook
      var storeName = req.body.order_status_url.split('/')[2];
      const {line_items, shipping_address, customer, updated_at} = req.body;
      var user = await UserModel.findOne({storeName});
      for(var i = 0; i < line_items.length; i ++) {
        let type = line_items[i].sku.split('-')[0];
        let product_id = line_items[i].sku.split('-')[1];
        let price = undefined;
        if (type === 'self') {
          let product = await ProductModel.findById(product_id);
          let variant = product.variants.find(x => ("self-" + x.sku) === line_items[i].sku);
          price = variant.price;
        }

        await OrderModel.create({
          client: {
            name: user.name,
            email: user.email,
            storeName: user.storeName,
          },
          quantity: line_items[i].quantity,
          product_id: product_id,
          sku: line_items[i].sku,
          shippingAddress: shipping_address,
          price: price,
          status: "pending"
        });
        return res.sendStatus(200);
      }
    } else { // Unsafe Hook
      console.log("danger");
    }
  },
  /*
   * Adding a new order when adding a new product to the shopify store
   * This function is called when a new product is added to store
   * So, we have determine the product type 
   * and if the product is from aliexpress, we don't add the order
  */
  addOrders: async function(import_id, product_details, user) {
    // Check the product type
    var type = import_id.split('-')[0];
    var product_id = import_id.split('-')[1];

    // If it's from aliexpress, don't add the order
    if (type != 'self') return;
    /*
     * This product is not from aliexpress
     * Get the variant detail from the sku
    */
    for (var idx = 0; idx < product_details.variants.length; idx ++ ) {
      // Find the variant using the sku
      let product = await ProductModel.findById(product_id);
      let variant = product.variants.find(x => ("self-" + x.sku) === product_details.variants[idx].sku);
      let price = variant.price; // The original price of the variant

      // Add the order to the database
      await OrderModel.create({
        client: {
          name: user.name,
          email: user.email,
          storeName: user.storeName,
        },
        quantity: -1,
        product_id: product_id,
        sku: product_details.variants[idx].sku,
        shippingAddress: null,
        price: price,
        status: "pending"
      });
    }
  },
  /*
   * List all the orders of the user
  */
  getOrders: async function (req, res) {
    // Get the current user
    var user = await UserModel.findById(req.user._id);
    if (user == null ) {
      return res.json({
        status: "failure",
        error: {
          message: "Not authorized"
        }
      });
    }

    // Find all orders of this user
    OrderModel.find({"client.email": user.email}, function(err, orders) {
      if (err) {
        return res.json({
          status: "failure",
          error: {
            message: "Error while find on database"
          }
        });
      }
      
      var orders_details = getOrderDetails(user, orders);
      return res.json({
        status: "success",
        data:{
          orders: orders_details
        } 
      }); 
    });
  },
  /*
   * List processed orders of the user
  */
  getProcessedOrders: async function (req, res) {
    // Get the current user
    var user = await UserModel.findById(req.user._id);
    if (user == null ) {
      return res.json({
        status: "failure",
        error: {
          message: "Not authorized"
        }
      });
    }

    // Find processed orders of the user from the DB
    OrderModel.find({"client.email": user.email, status: "processed"}, function(err, orders) {
      if (err) {
        return res.json({
          status: "failure",
          error: {
            message: "Error while find on database"
          }
        });
      }

      var orders_details = getOrderDetails(user, orders);
      return res.json({
        status: "success",
        data: {
          orders: orders_details
        }
      });
    });
  },
  /*
   * List delivered orders of the user
  */
  getShippedOrders: async function (req, res) {
    // Get the current user
    var user = await UserModel.findById(req.user._id);
    if (user == null ) {
      return res.json({
        status: "failure",
        error: {
          message: "Not authorized"
        }
      });
    }

    // Find the delivered orders of the user from DB
    OrderModel.find({"client.email": user.email, status: "shipped"}, function(err, orders) {
      if (err) {
        return res.json({
          status: "failure",
          error: {
            message: "Error while find on database"
          }
        });
      }

      var orders_details = getOrderDetails(user, orders);

      return res.json({
        status: "success",
        data: {
          orders: orders_details
        }
      });
    });
  },
  /*
   * List unprocessed orders of the user
  */
  getUnprocessedOrders: async function (req, res) {
    // Get the current user
    var user = await UserModel.findById(req.user._id);
    if (user == null ) {
      return res.json({
        status: "failure",
        error: {
          message: "Not authorized"
        }
      });
    }

    // Find the unprocessed orders from the DB
    var p_orders = await OrderModel.find({ "client.email": user.email, status: "pending", quantity: -1});

    var orders_details = [];
    for(let i = 0; i < p_orders.length; i ++) {
      let c_orders = await OrderModel.find({
            "client.email": user.email, 
            status: "pending", 
            product_id: p_orders[i].product_id,
            quantity: {$gt: 0}
          });
      let c_order_details = getOrderDetails(user, c_orders);

      let product = user.myProducts.find(x => x.id === ("self-" + p_orders[i].product_id));
      let variant = product.variants.find(x => x.sku === p_orders[i].sku);
      
      orders_details.push({
        id: p_orders[i]._id,
        client: p_orders[i].client,
        quantity: p_orders[i].quantity,
        product_id: p_orders[i].product_id,
        sku: p_orders[i].sku,
        status: p_orders[i].status,
        shippingAddress: p_orders[i].shippingAddress,
        price:  p_orders[i].price,
        variant: {
          title: product.title,
          image: variant.imageSrc ? variant.imageSrc : product.images[0].src
        },
        childOrders: c_order_details
      })
    }
    return res.json({
      status: "success",
      data: {
        orders: orders_details
      }
    });
  },
  /*
   * Mark the order as delivered
  */
  markAsShipped: async function(req, res) {
    // Get the order id from req
    var order_id = req.body.id;
    var order = await OrderModel.findById(order_id);
    
    if (order == null) {
      return res.json({
        status: "failure",
        error: {
          message: "Order not found"
        }
      });
    }

    // Update order status
    await OrderModel.updateOne({_id:order_id}, {status: "shipped"}, function(err, doc) {
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
   * Mark the order as processed
  */
  markAsProcessed: async function(req, res) {
    // Get the order id from req
    var order_id = req.body.id;
    var order = await OrderModel.findById(order_id);
    
    if (order == null) {
      return res.json({
        status: "failure",
        error: {
          message: "Order not found"
        }
      });
    }

    // Update the status
    await OrderModel.updateOne({_id:order_id}, {status: "processed" }, function(err, doc) {
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
  }
}