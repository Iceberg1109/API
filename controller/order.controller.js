const crypto = require('crypto');
const fetch = require("node-fetch");

const UserModel = require('../model/user.model');
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

module.exports = {
  orderCreated: async function(req, res) {
    generated_hash = crypto
      .createHmac('sha256', "bb000cf186bdb297cdc4d3ae2d9d9b5c")
      .update(Buffer.from(req.rawbody))
      .digest('base64');
    console.log("Webhook => ", req.body)
    if (generated_hash == req.headers['x-shopify-hmac-sha256']) {
      console.log("okay");
    } else {
      console.log("danger");
      var storeName = req.body.order_status_url.split('/')[2];
      var type = req.body.line_items[0].sku.split('-')[0];
      var id = req.body.line_items[0].sku.split('-')[1];
    
      await OrderModel.create({
        storeName: storeName, 
        type: type,
        quantity: req.body.line_items[0].quantity,
        id: id
      });
      // var user = await UserModel.find({storeName: store});
    }
  }
}