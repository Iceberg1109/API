var TopClient = require('node-taobao-topclient').default;
// var webdriver = require ('selenium-webdriver');
let webdriver = require('selenium-webdriver');
var By = webdriver.By;
let chrome = require('selenium-webdriver/chrome');
let chromedriver = require('chromedriver');

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
  getProductInfo: async function (req, res) {
    product_id = req.body.product_id;

    /*var client = new TopClient({
      'appkey': process.env.Ali_APPKEY,
      'appsecret': process.env.Ali_APPSECRET,
      'REST_URL': 'http://gw.api.taobao.com/router/rest'
    });
    
    client.execute('aliexpress.postproduct.redefining.findaeproductbyidfordropshipper', {
      product_id,
      // 'local_country':'RU',
      // 'local_language':'ru'
    }, async function (error, response) {
      if (!error) {
        console.log(response);
        var user = await UserModel.findById(req.user._id);
        var importedProducts = user.importedProducts;
        var product_details = {
          title: req.body.title,
          descriptionHtml: req.body.descriptionHtml,
          images: req.body.images,
          options: req.body.options,
          variants: req.body.variants
        };
        importedProducts.push(product_details);
    
        user = await UserModel.updateOne({_id:req.user._id}, {products: my_products}, function(err, doc) {
          if (err) return res.json({status : 'failed'});
          return res.json({status : 'success'});
        });
      }
      else{
        console.log(error);
      } 
    })*/
    var product_details = {
      title: "Product Title",
      descriptionHtml: "Description HTML",
      images: [{ src: "https://images-na.ssl-images-amazon.com/images/I/719PHq579pL._SL1500_.jpg" },
        { "src": "https://images-na.ssl-images-amazon.com/images/I/61gZIYJ9xlL._SY606_.jpg" }],
      options: ["Size", "Color"],
      variants:  [
        {
          imageSrc: "https://images-na.ssl-images-amazon.com/images/I/719PHq579pL._SL1500_.jpg",
          price: "25",
          options : ["42", "blue"]
        },
        {
          imageSrc: "https://images-na.ssl-images-amazon.com/images/I/61gZIYJ9xlL._SY606_.jpg",
          price: "25", 
          options : ["42", "red"]
        }]
    };
    res.json({status: "success", data: product_details});
  },
  addProduct: async function  (req, res) {
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
      variables: product_details
    });
    var user = await UserModel.findById(req.user._id);

    var api_url = "http://" + user.storeName + ".myshopify.com//admin/api/2019-07/graphql.json";
    // const response = await this.Fetch_GraphQL(api_url, NEW_PRODCUT);
    // console.log(response);

    // Add this product to the user's products' list
    var user = await UserModel.findById(req.user._id);
    var my_products = user.myProducts;
    my_products.push(product_details);

    user = await UserModel.updateOne({_id:req.user._id}, {myProducts: my_products}, function(err, doc) {
      if (err) return res.json({status : 'failed'});
      return res.json({status : 'success'});
    });
  }
}