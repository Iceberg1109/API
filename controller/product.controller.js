var paypal = require('paypal-rest-sdk');
const fetch = require("node-fetch");

// var TopClient = require('node-taobao-topclient').default;
var TopClient = require('topsdk');

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

// let webdriver = require('selenium-webdriver');
// var By = webdriver.By;
// let chrome = require('selenium-webdriver/chrome');
// let chromedriver = require('chromedriver');

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
    const browser = await puppeteer.launch({ 
      args: ["--no-sandbox", "--disable-setuid-sandbox"], 
      headless: false ,
      timeout: 0});
    //headless true or false

    // new page
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0); 
    await page.goto("https://www.aliexpress.com/item/" + product_id + ".html");
    await page.waitFor(1000);
    try {
      await page.$eval('.next-dialog-close', elem => elem.click());
    }
    catch(err) {}
    // await page.waitForNavigation();
    // await page.waitForSelector('.images-view-item');
    // Product Title
    const [elementHandle] = await page.$x('.//div[@class="product-title"]');
    const propertyHandle = await elementHandle.getProperty('innerText');
    const product_title = await propertyHandle.jsonValue();

    // Product Images
    const img_elements = await page.$x('.//div[@class="images-view-item"]/img');
    const product_images = await page.evaluate((...elements) => {
      return elements.map(e => { 
        return {src: e.src};
      });
    }, ...img_elements);

    // Product Options
    const skus = await page.$$("div.sku-property");
    var product_options = [];
    var product_options_list = [];
    for( let sku of skus ) {
        const attr = await page.evaluate(async e => {
          var title = e.querySelector(".sku-title").innerText;
          title = title.split(':')[0];
          const text_elements = e.querySelectorAll(".sku-property-item");
          var list = [];
          for (let element of text_elements) {
            list.push(element.innerText);
          }
          
          return {title, list};
        }, sku);
        
        product_options.push(attr.title);
        product_options_list.push(attr.list);
    }
    
    func(product_options_list, 0 ,0);

    var variants = [];
    for (var i = 0; i < path.length; i ++) {
      var options = [];
      
      // Click the each variant
      for (var j = 0; j < path[i].length; j ++) {
        await page.$eval('.sku-property:nth-child(' + (j + 1).toString() + ') .sku-property-list li:nth-child(' + path[i][j] +')', elem => elem.click());
        await page.waitFor(100);
      }

      // Get variant details
      for (var j = 0; j < path[i].length; j ++) { // Variant Options
        try {
          const [elementHandle] = await page.$x('(//span[@class="sku-title-value"])[' + (j + 1).toString() + ']');
          const propertyHandle = await elementHandle.getProperty('innerText');
          const sku_value = await propertyHandle.jsonValue();
          options.push(sku_value);
        } catch(err) { }
      }
      
      if (options.indexOf("") === -1) { // New Variant
        var regex = /[+-]?\d+(\.\d+)?/g;

        const variant_price = await page.$eval('.product-price-value', el => el.textContent);
        var price = parseFloat(variant_price.match(regex)[0]);

        const quantity = await page.$eval('.product-quantity-tip span', el => el.textContent);
        var inventoryQuantity = parseInt(quantity.match(regex)[0]);
        
        variants.push({options, price, inventoryQuantity});
      }
      // Deselect all skus
      await page.$$eval('.sku-property-item.selected', elements => elements.map(e => e.click()));
      await page.waitFor(500);
    }
    await browser.close();
    /* Dummny Data */
    var product_details = {
      id: "ali-" + product_id,
      title: product_title,
      descriptionHtml: "Description HTML",
      images: product_images,
      options: product_options,
      variants:  variants
    };
    console.log(product_details);
    
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
var path = [];
var single = [];

function func(options, step)
{
	if( step >= options.length ) {
    path.push([...single]);
  } 
  else {
    for(var i = 0; i < options[step].length; i ++) {
      single[step] = i + 1;
      func(options, step + 1);
    }
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