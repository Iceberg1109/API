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
    UserModel.findById(req.user._id, function (err, user) {
      if (err) {
        return res.json({
          status: "failure",
          error: {
            message: "User not found"
          }
        });
      }

      return res.json({
        status :        "success",
        data: {
          name :          user.name,
          email :         user.email,
          store :         user.storeName,
          isAdmin :       user.isAdmin,
          priceRule :     user.priceRule,
          salePriceRule : user.salePriceRule
        }
      });
    });
  },
  getMyProducts: function (req, res, next) {
    UserModel.findById(req.user._id, function (err, user) {
      if (err)if (err) {
        return res.json({
          status: "failure",
          error: {
            message: "User not found"
          }
        });
      }
      
      return res.json({
        status: "success",
        data: {
          products: user.myProducts
        }
      });
    });
  },
  getImportedProducts: function (req, res, next) {
    UserModel.findById(req.user._id, function (err, user) {
      if (err)if (err) {
        return res.json({
          status: "failure",
          error: {
            message: "User not found"
          }
        });
      }
      
      return res.json({
        status: "success",
        data: {
          products: user.importedProducts
        }
      });
    });
  },
  editImportedProduct: async function  (req, res) {
    var product_details = {
      id:  req.body.id,
      title: req.body.title,
      descriptionHtml: req.body.descriptionHtml,
      images: req.body.images,
      options: req.body.options,
      variants: req.body.variants
    };
    
    var user = await UserModel.findById(req.user._id);

    var importedProducts = user.importedProducts;
    var imported_id = importedProducts.findIndex(x => x.id === product_details.id);
    importedProducts[imported_id] = product_details;

    user = await UserModel.updateOne({_id:req.user._id}, {importedProducts: importedProducts}, function(err, doc) {
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
  removeImportedProduct: async function  (req, res) {
    var product_id =  req.body.id;
    
    var user = await UserModel.findById(req.user._id);

    var importedProducts = user.importedProducts;
    importedProducts = importedProducts.filter(item => item.id !== product_id)
    // importedProducts = importedProducts.splice(imported_id, 1);;

    user = await UserModel.updateOne({_id:req.user._id}, {importedProducts: importedProducts}, function(err, doc) {
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
  setPriceRule: async function(req, res) {
    var new_rule = req.body.rule;
    var user = await UserModel.updateOne({_id:req.user._id}, {priceRule: new_rule}, function(err, doc) {
      if (err) {
        return res.json({
          status: "failure",
          error: {
            message: "Could not update the database"
          }
        });
      }
      return res.json({status : 'success'});
    });
  },
  setSalePriceRule: async function(req, res) {
    var new_rule = req.body.rule;
    var user = await UserModel.updateOne({_id:req.user._id}, {salePriceRule: new_rule}, function(err, doc) {
      if (err){
        return res.json({
          status: "failure",
          error: {
            message: "Could not update the database"
          }
        });
      }
      return res.json({status : 'success'});
    });
  },
  resetUserPwd: async function(req, res) {
    var old_pwd = req.body.old_pwd;
    var new_pwd = req.body.new_pwd;
    
    var user = await UserModel.findById(req.user._id);
    if( !user ){
      return res.json({
        status: "failure",
        error: {
          message: "User not found"
        }
      });
    }

    const validate = await user.isValidPassword(old_pwd);
    if( !validate ){
      return res.json({
        status: "failure",
        error: {
          message: "Wrong Password"
        }
      });
    }

    const hash = await bcrypt.hash(new_pwd, 10);
    
    var user = await UserModel.updateOne({_id:req.user._id}, {password: hash}, function(err, doc) {
      if (err) {
        return res.json({
          status: "failure",
          error: {
            message: "Could not update the database"
          }
        });
      }
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
      return res.json({
        status: "failure",
        error: {
          message: "Could not add the webhook"
        }
      });
    }

    res.json({status : 'success'});
  },
}