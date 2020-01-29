var bcrypt = require('bcrypt');
const fetch = require("node-fetch");
const UserModel = require('../model/user.model');

Fetch_GraphQL = async (url, fields, storeAccessToken) => {
  const response = await fetch(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": storeAccessToken,
      },
      body: fields
    }
  );
  const responseJson = await response.json();
  return responseJson;
};

module.exports = {
  getUserInfo: function (req, res, next) {
    UserModel.findById(req.user._id, 'name email storeName', function (err, user) {
      if (err) return res.json({status: "no user"});
      console.log("get", user);
      return res.json({
        status: "success",
        name: user.name,
        email: user.email,
        store: user.storeName
      });
    });
  },
  getMyProducts: function (req, res, next) {
    UserModel.findById(req.user._id, function (err, user) {
      if (err) return res.json({status: "no user"});
      
      return res.json({
        status: "success",
        products: user.myProducts
      });
    });
  },
  getImportedProducts: function (req, res, next) {
    UserModel.findById(req.user._id, function (err, user) {
      if (err) return res.json({status: "no user"});
      
      return res.json({
        status: "success",
        products: user.importedProducts
      });
    });
  },
  resetUserPwd: async function(req, res) {
    var old_pwd = req.body.old_pwd;
    var new_pwd = req.body.new_pwd;
    
    var user = await UserModel.findById(req.user._id);
    if( !user ) return res.json({status : 'failed'});

    const validate = await user.isValidPassword(old_pwd);
    if( !validate ){
      console.log("wrong pwd");
      return res.json({status : 'wrong pwd'});
    }

    const hash = await bcrypt.hash(new_pwd, 10);
    
    var user = await UserModel.updateOne({_id:req.user._id}, {password: hash}, function(err, doc) {
      if (err) return res.json({status : 'failed'});
      return res.json({status : 'success'});
    });
  },
  addWebhook: async function  (req, res) {
    const NEW_WEBHOOK =  JSON.stringify({
      query: `mutation {
        webhookSubscriptionCreate(topic: ORDERS_CREATE, webhookSubscription: {callbackUrl: "https://7896f79f.ngrok.io/normal/order/created", format: JSON}) {
          userErrors {
            field
            message
          }
          webhookSubscription {
            id
          }
        }
      }
      `
    });

    var user = await UserModel.findById(req.user._id);

    console.log("user data => ", user.storeName, user.storeAccessToken);
    var api_url = "https://" + user.storeName + "/admin/api/2020-01/graphql.json";
    const response = await Fetch_GraphQL(api_url, NEW_WEBHOOK, user.storeAccessToken);
    if (response.errors || response.data.webhookSubscriptionCreate.userErrors.length > 0) {
      return res.json({status : 'failed'});
    }
    console.log("hook response => ", response.data.webhookSubscriptionCreate.webhookSubscription.id);
    res.json({status : 'success'});
  },
}