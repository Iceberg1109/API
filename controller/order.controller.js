const crypto = require('crypto');
const fetch = require("node-fetch");

const UserModel = require('../model/user.model');

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
  orderCreated: function(req, res) {
    generated_hash = crypto
      .createHmac('sha256', "bb000cf186bdb297cdc4d3ae2d9d9b5c")
      .update(Buffer.from(req.rawbody))
      .digest('base64');
    console.log("Webhook => ", req.body)
    if (generated_hash == req.headers['x-shopify-hmac-sha256']) {
      console.log("okay");
    } else {
      console.log("danger");
    }
  }
}