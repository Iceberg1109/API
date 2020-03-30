const crypto = require('crypto');
const fetch = require("node-fetch");

const UserModel = require('../model/user.model');
const ProductModel = require('../model/product.model');
const OrderModel = require('../model/order.model');

Fetch_GraphQL = async (url, fields, storeAccessToken) => {
  const response = await fetch(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": storeAccessToken
      },
      body: fields
    }
  );
  const responseJson = await response.json();
  return responseJson;
};

getOrderDetails = (user, orders) => {
  var orders_details = [];
  for(let i = 0; i < orders.length; i ++) {
    let product = user.myProducts.find(x => x.id === (orders[i].type + "-" + orders[i].product_id));
    let variant = product.variants.find(x => x.sku === orders[i].sku);
    
    orders_details.push({
      id: orders[i]._id,
      storeName: orders[i].storeName,
      type: orders[i].type,
      quantity: orders[i].quantity,
      product_id: orders[i].product_id,
      sku: orders[i].sku,
      isShipped: orders[i].isShipped,
      isProcessed: orders[i].isProcessed,
      client: orders[i].client, 
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
  orderCreated: async function(req, res) {
    generated_hash = crypto
      // .createHmac('sha256', process.env.SHOPIFY_PARTNER_APISECRET)
      .createHmac('sha256', "146f314814ccaf1ffd014c219b527620dbdf4d338bc9eb43bb4409b0671a2509")
      .update(Buffer.from(req.rawbody))
      .digest('base64');

    if (generated_hash == req.headers['x-shopify-hmac-sha256']) { // Safe Hook
      var storeName = req.body.order_status_url.split('/')[2];
      const {line_items, shipping_address, customer, updated_at} = req.body;

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
          storeName: storeName, 
          type: type,
          quantity: line_items[i].quantity,
          product_id: product_id,
          sku: line_items[i].sku,
          isShipped: false,
          isProcessed: false,
          client: {
            email: customer.email,
            first_name: customer.first_name,
            lastst_name: customer.lastst_name
          },
          date: updated_at,
          shippingAddress: shipping_address,
          price: price
        });
      }
    } else { // Unsafe Hook
      console.log("danger");
    }
  },
  getOrders: async function (req, res) {
    var user = await UserModel.findById(req.user._id);
    if (user == null ) {
      return res.json({
        status: "failure",
        error: {
          message: "Not authorized"
        }
      });
    }

    OrderModel.find({storeName: user.storeName}, function(err, orders) {
      if (err) {
        return res.json({
          status: "failure",
          error: {
            message: "Error while find on database"
          }
        });
      }
      
      var orders_details = getOrderDetails(user, orders);
      console.log(orders_details);
      return res.json({
        status: "success",
        data:{
          orders: orders_details
        } 
      }); 
    });
  },
  getProcessedOrders: async function (req, res) {
    var user = await UserModel.findById(req.user._id);
    if (user == null ) {
      return res.json({
        status: "failure",
        error: {
          message: "Not authorized"
        }
      });
    }

    OrderModel.find({storeName: user.storeName, isProcessed: true}, function(err, orders) {
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
  getShippedOrders: async function (req, res) {
    var user = await UserModel.findById(req.user._id);
    if (user == null ) {
      return res.json({
        status: "failure",
        error: {
          message: "Not authorized"
        }
      });
    }

    OrderModel.find({storeName: user.storeName, isShipped: true}, function(err, orders) {
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
  getUnprocessedOrders: async function (req, res) {
    var user = await UserModel.findById(req.user._id);
    if (user == null ) {
      return res.json({
        status: "failure",
        error: {
          message: "Not authorized"
        }
      });
    }

    OrderModel.find({storeName: user.storeName, isProcessed: false}, function(err, orders) {
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
  markAsShipped: async function(req, res) {
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
    
    order.isShipped = true;
    await OrderModel.updateOne({_id:order_id}, {isShipped: true}, function(err, doc) {
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
  markAsProcessed: async function(req, res) {
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

    await OrderModel.updateOne({_id:order_id}, {isProcessed: true}, function(err, doc) {
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