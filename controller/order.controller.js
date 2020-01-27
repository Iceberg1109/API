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
  addWebhook: async function  (req, res) {
    console.log("Add product", product_details);

    const ADD_WEBHOOK = JSON.stringify({
      query: `mutation {
                webhookSubscriptionCreate(topic: ORDERS_CREATE,
                  webhookSubscription: {callbackUrl: "https://api.com"})
              }`
    });
    var user = await UserModel.findById(req.user._id);

    var api_url = "http://" + user.storeName + ".myshopify.com//admin/api/2019-07/graphql.json";
    const response = await Fetch_GraphQL(api_url, ADD_WEBHOOK, user.storeAccessToken);
    console.log(response);
  },
  orderCreated: function(req, res) {
    generated_hash = crypto
      .createHmac('sha256', "146f314814ccaf1ffd014c219b527620dbdf4d338bc9eb43bb4409b0671a2509")
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