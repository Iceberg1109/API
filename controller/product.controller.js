const fetch = require("node-fetch");

// var TopClient = require('node-taobao-topclient').default;
var TopClient = require('topsdk');
// var webdriver = require ('selenium-webdriver');
let webdriver = require('selenium-webdriver');
var By = webdriver.By;
let chrome = require('selenium-webdriver/chrome');
let chromedriver = require('chromedriver');

const ProductModel = require('../model/product.model');
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
  getSelfProducts: function (req, res) {
    ProductModel.find({}, function(err, products) {
      if (err) {
        console.log(err);
        return res.json({status: "fail"});
      }
      var productMap = [];
      
      var idx = 0;
      products.forEach(function(product) {
        productMap.push(product);
        idx ++;
      });
  
      res.json({status: "success",count: idx, products: productMap});  
    });
  },
  getSaleProducts: function (req, res) {
    ProductModel.find({onSale: true, category: req.body.category}, function(err, products) {
      if (err) {
        console.log(err);
        return res.json({status: "fail"});
      }
      var productMap = [];
      
      var idx = 0;
      products.forEach(function(product) {
        productMap.push(product);
        idx ++;
      });
  
      res.json({status: "success",count: idx, products: productMap});  
    });
  },
  getTopSellingProducts: function (req, res) {
    ProductModel.find({}).sort('-soldCount').limit(req.body.count).exec(function(err, products){
      if (err) {
        console.log(err);
        return res.json({status: "fail"});
      }
      var productMap = [];
      
      var idx = 0;
      products.forEach(function(product) {
        productMap.push(product);
        idx ++;
      });
  
      res.json({status: "success",count: idx, products: productMap});  
    });
  },
  getAliProductInfo: async function (req, res) {
    product_id = req.body.product_id;

    //https://oauth.taobao.com/authorize?response_type=token&client_id=12345678&state=1212&view=web&redirect_uri=Callback URL
    
    // var client = new TopClient({
    //   'appkey': process.env.Ali_APPKEY,
    //   'appsecret': process.env.Ali_APPSECRET,
    //   'REST_URL': 'http://gw.api.taobao.com/router/rest'
    // });
    var client = new TopClient(process.env.Ali_APPKEY, process.env.Ali_APPSECRET, {
      endpoint: 'http://gw.api.taobao.com/router/rest',
      useValidators: false,
      rawResponse: false
    });
    
    await client.execute('aliexpress.postproduct.redefining.findaeproductbyidfordropshipper', {
      product_id: product_id,
      nick: "cn1530062784shpl",
      session: "500022016051AUgiq17749c1d9Rplafav3trzEIEwjzIv0FcW8oPiPOWtoc6LiX47Yi"
      // 'local_country':'RU',
      // 'local_language':'ru'
    }, async function (error, response) {
      if (!error) {
        console.log("ali => ", response);
        // var user = await UserModel.findById(req.user._id);
        // var importedProducts = user.importedProducts;
        // var product_details = {
        //   title: req.body.title,
        //   descriptionHtml: req.body.descriptionHtml,
        //   images: req.body.images,
        //   options: req.body.options,
        //   variants: req.body.variants
        // };
        // importedProducts.push(product_details);
    
        // user = await UserModel.updateOne({_id:req.user._id}, {products: my_products}, function(err, doc) {
        //   if (err) return res.json({status : 'failed'});
        //   return res.json({status : 'success'});
        // });
      }
      else{
        console.log("ali err => ", error);
      } 
    })
    
  },
  importProduct: async function  (req, res) {
    var product_details = {
      title: req.body.title,
      descriptionHtml: req.body.descriptionHtml,
      images: req.body.images,
      options: req.body.options,
      variants: req.body.variants
    };
    
    var user = await UserModel.findById(req.user._id);

    var importedProducts = user.importedProducts;
    importedProducts.push(product_details);

    user = await UserModel.updateOne({_id:req.user._id}, {importedProducts: importedProducts}, function(err, doc) {
      if (err) return res.json({status : 'failed'});
      return res.json({status : 'success'});
    });
  },
  addProduct2Store: async function  (req, res) {
    var product_details = {
      title: req.body.title,
      descriptionHtml: req.body.descriptionHtml,
      images: req.body.images,
      options: req.body.options,
      variants: req.body.variants
    };
    
    console.log("Add product", product_details);

    const NEW_PRODCUT = JSON.stringify({
      query: `mutation($input: ProductInput!) {
                productCreate(input: $input)
                {
                  userErrors {
                    field
                    message
                  }
                }
              }`,
      variables: {
        input: product_details
      }
    });

    var user = await UserModel.findById(req.user._id);

    var api_url = "https://" + user.storeName + "/admin/api/2020-01/graphql.json";
    try {
      const response = await Fetch_GraphQL(api_url, NEW_PRODCUT, user.storeAccessToken);
      console.log("after adding product => ", response);

      // Add this product to the user's products' list
      //var user = await UserModel.findById(req.user._id);
      console.log(response.data.productCreate.userErrors.length);
      if (response.errors || response.data.productCreate.userErrors.length > 0) {
        return res.json({status : 'failed'});
      }

      var my_products = user.myProducts;
      my_products.push(product_details);

      user = await UserModel.updateOne({_id:req.user._id}, {myProducts: my_products}, function(err, doc) {
        if (err) return res.json({status : 'failed'});
        return res.json({status : 'success'});
      });
    }
    catch(err) {
      console.log("adding product err => ", err);
      res.json({status : 'failed'});
    }
  }
}