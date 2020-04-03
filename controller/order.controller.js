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
  addOrders: async function(import_id, product_details, user) {
    var type = import_id.split('-')[0];
    var product_id = import_id.split('-')[1];
    console.log("Users", user);
    if (type != 'self') return;
    for (var idx = 0; idx < product_details.variants.length; idx ++ ) {
      let product = await ProductModel.findById(product_id);
      let variant = product.variants.find(x => ("self-" + x.sku) === product_details.variants[idx].sku);
      let price = variant.price;

      await OrderModel.create({
        client: {
          name: user.name,
          email: user.email,
          storeName: user.storeName,
        },
        quantity: product_details.variants[idx].inventoryQuantity,
        product_id: product_id,
        sku: product_details.variants[idx].sku,
        // date: ,
        shippingAddress: null,
        price: price,
        status: "pending"
      });
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

    OrderModel.find({"client.email": user.email, status: "pending"}, function(err, orders) {
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

    await OrderModel.updateOne({_id:order_id}, {status: "processed", shippingAddress:req.body.address }, function(err, doc) {
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