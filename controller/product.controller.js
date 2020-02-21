var paypal = require('paypal-rest-sdk');
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
        return res.json({
          status: "failure",
          error: {
            message: "Error while find on database"
          }
        });
      }
     
      return res.json({
        status: "success",
        data: {
          products: products
        }
      });  
    });
  },
  getByCategory: function (req, res) {
    ProductModel.find({category: req.body.category}, function(err, products) {
      if (err) {
        return res.json({
          status: "failure",
          error: {
            message: "Error while find on database"
          }
        });
      }
  
      return res.json({
        status: "success",
        data: {
          products: products
        }
      }); 
    });
  },
  getById: async function (req, res) {
    var product = await ProductModel.findById(req.body.id);
    if (product == null) {
      return res.json({
        status: "failure",
        error: {
          message: "Error while find on database"
        }
      });
    }
    return res.json({
      status: "success",
      data: product
    });
  },
  getSaleProducts: function (req, res) {
    ProductModel.find({onSale: true}, function(err, products) {
      if (err) {
        return res.json({
          status: "failure",
          error: {
            message: "Error while find on database"
          }
        });
      }
     
      return res.json({
        status: "success",
        data: {
          products: products
        }
      }); 
    });
  },
  getTopSellingProducts: function (req, res) {
    ProductModel.find({}).sort('-soldCount').limit(req.body.count).exec(function(err, products){
      if (err) {
        return res.json({
          status: "failure",
          error: {
            message: "Error while find on database"
          }
        });
      }
  
      return res.json({
        status: "success",
        data: {
          products: products
        }
      });
    });
  },
  getAliProductInfo: async function (req, res) {
    product_id = req.body.product_id;

    //https://oauth.taobao.com/authorize?response_type=token&client_id=12345678&state=1212&view=web&redirect_uri=Callback URL
   
    /*var client = new TopClient(process.env.Ali_APPKEY, process.env.Ali_APPSECRET, {
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
    })*/
    /* Dummny Data */
    var product_details = {
      id: "ali-" + product_id,
      title: "Product Title",
      descriptionHtml: "Description HTML",
      images: [{ src: "https://images-na.ssl-images-amazon.com/images/I/719PHq579pL._SL1500_.jpg" },
        { "src": "https://images-na.ssl-images-amazon.com/images/I/61gZIYJ9xlL._SY606_.jpg" }],
      options: ["Size", "Color"],
      variants:  [
        {
          imageSrc: "https://images-na.ssl-images-amazon.com/images/I/719PHq579pL._SL1500_.jpg",
          price: "25",
          options : ["42", "blue"],
          inventoryQuantity: 6
        },
        {
          imageSrc: "https://images-na.ssl-images-amazon.com/images/I/61gZIYJ9xlL._SY606_.jpg",
          price: "25", 
          options : ["42", "red"],
          inventoryQuantity: 5
        }]
    };
    // Add the product to imported list
    var user = await UserModel.findById(req.user._id);
    var importedProducts = user.importedProducts;
    importedProducts.push(product_details);

    user = await UserModel.updateOne({_id:req.user._id}, {importedProducts: importedProducts}, function(err, doc) {
      if (err) {
        return res.json({
          status: "failure",
          error: {
            message: "Error while find on database"
          }
        });
      }
      return res.json({status: "success", data: product_details});
    });
  },
  importProduct: async function  (req, res) {
    var product_id = req.body.id;
    var product = await ProductModel.findById(product_id);
    
    if (product == null) {
      return res.json({
        status: "failure",
        error: {
          message: "Product not found"
        }
      });
    }
    product._id = undefined;
    var product_details = {
      id: "self-" + product_id,
      title: product.title,
      descriptionHtml:product.descriptionHtml,
      images: product.images,
      options: product.options,
      variants: product.variants
    };
    product.id = "self_" + product_id;
    console.log("product details => ", product_details);

    var user = await UserModel.findById(req.user._id);
    var importedProducts = user.importedProducts;
    importedProducts.push(product_details);

    user = await UserModel.updateOne({_id:req.user._id}, {importedProducts: importedProducts}, function(err, doc) {
      if (err) {
        return res.json({
          status: "failure",
          error: {
            message: "Error while find on database"
          }
        });
      }
      return res.json({status : 'success'});
    });
  },
  addProduct2Store: async function  (req, res) {
    var import_id = req.body.id;
    var user = await UserModel.findById(req.user._id);
    var product_details = user.importedProducts.find(x => x.id == import_id);
    console.log(product_details);
    product_details.id = `gid://shopify/Product/${product_details.id}`;
   
    for (var idx = 0; idx < product_details.variants.length; idx ++ ) {
      product_details.variants[idx].inventoryManagement = 'SHOPIFY';
      product_details.variants[idx].sku = req.body.id + "-" + product_details.variants[idx].options.join('-');
      if (product_details.variants[idx].salePrice) {
        product_details.variants[idx].price = product_details.variants[idx].salePrice;
        product_details.variants[idx].salePrice = undefined;
      }
    }

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

    var api_url = "https://" + user.storeName + "/admin/api/2019-07/graphql.json";
    try {
      const response = await Fetch_GraphQL(api_url, NEW_PRODCUT, user.storeAccessToken);
      console.log("after adding product => ", response);

      // Add this product to the user's products' list
      //var user = await UserModel.findById(req.user._id);
      console.log(response.data.productCreate.userErrors.length);
      if (response.errors || response.data.productCreate.userErrors.length > 0) {
        return res.json({
          status: "failure",
          error: {
            message: "Error while find on database"
          }
        });
      }

      var my_products = user.myProducts;
      product_details.id = req.body.id;
      my_products.push(product_details);

      user = await UserModel.updateOne({_id:req.user._id}, {myProducts: my_products}, function(err, doc) {
        if (err) {
          return res.json({
            status: "failure",
            error: {
              message: "Error while find on database"
            }
          });
        }
        return res.json({status : 'success'});
      });
    }
    catch(err) {
      console.log("adding product err => ", err);
      return res.json({
        status: "failure",
        error: {
          message: "Error while find on database"
        }
      });
    }
  },
  startPayment: async function  (req, res) {
    var  name = req.body.title;
    var price = req.body.price;
    
    var payment = {
      "intent": "authorize",
      "payer": {
        "payment_method": "paypal"
      },
      "redirect_urls": {
        "return_url": "http://127.0.0.1:3000/success",
        "cancel_url": "http://127.0.0.1:3000/err"
      },
      "transactions": [{
        "item_list": {
            "items": [{
                "name": name,
                "sku": "001",
                "price": price,
                "currency": "USD",
                "quantity": 1
            }]
        },
        "amount": {
          "total": parseInt(price),
          "currency": "USD"
        },
        "description": " a book on mean stack "
      }]
    }

    createPay( payment ) 
    .then( ( transaction ) => {
      var id = transaction.id; 
      var links = transaction.links;
      var counter = links.length; 
      console.log("transaction:", transaction);
      while( counter -- ) {
        if ( links[counter].method == 'REDIRECT') {
          return res.json({
            status: "success", 
            data: {
              link: links[counter].href
            }
          });
        }
        else {
          return res.json({
            status: "failure",
            error: {
              message: "Error while creating login"
            }
          });
        }
      }
    })
    .catch( ( err ) => { 
      console.log( err ); 
      return res.json({
        status: "failure",
        error: {
          message: "Something went wrong"
        }
      });
    });
  },
  executePayment: async function  (req, res) {
    console.log(req.query); 

    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
    
    const execute_payment_json = {
      "payer_id" : payerId, 
      "transactions" : [{
        "amount" : {
          "currency": "USD",
          "total": "39.00"
        }
      }]
    };

    paypal.payment.execute(paymentId, execute_payment_json, (error, payment) => {
      if(error) {
        console.log(error.response);
        throw error;
      } else {
        console.log("Get Payment Response");
        console.log(JSON.stringify(payment));
        res.redirect('/success.html'); 
      }
    });
  }
}

var createPay = ( payment ) => {
  return new Promise( ( resolve , reject ) => {
    paypal.payment.create( payment , function( err , payment ) {
    if ( err ) {
      reject(err); 
    }
    else {
      resolve(payment); 
    }
    }); 
  });
}