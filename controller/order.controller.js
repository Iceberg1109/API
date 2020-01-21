const crypto = require('crypto');

const UserModel = require('../model/user.model');

Fetch_GraphQL = async (url, fields) => {
  const response = await fetch(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": ACCESSTOKEN
      },
      body: fields
    }
  );
  const responseJson = await response.json();
  return responseJson;
};

module.exports = {
  addWebhook: async function  (req, res) {
    var product_details = {
      title: req.body.title,
      descriptionHtml: req.body.descriptionHtml,
      images: req.body.images,
      options: req.body.options,
      variants: req.body.variants
    };

    console.log("Add product", product_details);

    const ADD_WEBHOOK = JSON.stringify({
      query: `mutation {
                webhookSubscriptionCreate(topic: ORDERS_CREATE,
                  webhookSubscription: {callbackUrl: "https://api.com"})
              }`
    });
    var user = await UserModel.findById(req.user._id);

    var api_url = "http://" + user.storeName + ".myshopify.com//admin/api/2019-07/graphql.json";
    // const response = await this.Fetch_GraphQL(api_url, ADD_WEBHOOK);
    // console.log(response);
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