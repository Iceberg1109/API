const fetch = require("node-fetch");

// var TopClient = require('node-taobao-topclient').default;
var TopClient = require('topsdk');

const ProductModel = require('../model/product.model');
const UserModel = require('../model/user.model');

const OrderController = require('../controller/order.controller');

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
    var product_id = req.body.product_id;
    console.log("here", product_id);
    
    const response = await fetch(
      `http://api.onebound.cn/aliexpress/api_call.php?num_iid=${product_id}&api_name=item_get&lang=en&key=tel13823615529&secret=20200310`,
      {
        method: "GET",
      }
    );
    const {item} = await response.json();
    
    // Product Title
    product_title = item.title.split("| |  - AliExpress")[0];
    // Product Images
    product_images = [];
    var imgs = item.item_imgs.item_img ? item.item_imgs.item_img : item.item_imgs;
    for (var i = 0; i < imgs.length; i ++) {
      product_images.push({src: imgs[i].url});
    }
    // Product variant options
    var options = new Set();
    for (let [key, value] of Object.entries(item.props_list)) {
      var option = value.split(":")[0];
      options.add(option);
    }

    var product_options = Array.from(options.values());
    // Product variants
    var variants = [];
    for (i = 0; i < item.skus.sku.length; i ++) {
      var options = [];

      var _options = item.skus.sku[i].properties_name.split(":;");
      for (j = 0; j < _options.length; j ++) {
        var temp = _options[j].split("#");

        if (temp.length > 1) options.push(temp[1].split(":")[0]);
        else options.push(temp[0].split(":").pop());
      }
      var price = item.skus.sku[i].price;
      var inventoryQuantity = item.skus.sku[i].quantity;
      variants.push({options, price, inventoryQuantity});
    }
    console.log(variants);
    /* Dummny Data */
    var product_details = {
      id: "ali-" + product_id,
      title: product_title,
      descriptionHtml: item.desc,
      images: product_images,
      options: product_options,
      variants:  variants
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
    var user = await UserModel.findById(req.user._id);

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
    for (var idx = 0; idx < product_details.variants.length; idx ++ ) {
      product_details.variants[idx].originalPrice = product_details.variants[idx].price;
      product_details.variants[idx].price = user.priceRule * product_details.variants[idx].price;
    }

    var importedProducts = user.importedProducts;
    importedProducts.push(product_details);

    user = await UserModel.updateOne({_id:req.user._id}, {importedProducts: importedProducts}, function(err, doc) {
      if (err) {
        console.log(err)
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
    var product_details = user.importedProducts.find(x => x.id === import_id);

    product_details.id = `gid://shopify/Product/${product_details.id}`;

    for (var idx = 0; idx < product_details.variants.length; idx ++ ) {
      product_details.variants[idx].inventoryManagement = 'SHOPIFY';
      product_details.variants[idx].sku = req.body.id + "-" + product_details.variants[idx].options.join('-');
      if (product_details.variants[idx].salePrice) {
        product_details.variants[idx].price = product_details.variants[idx].salePrice;
        product_details.variants[idx].salePrice = undefined;
      }
      if (product_details.variants[idx].originalPrice) {
        product_details.variants[idx].originalPrice = undefined;
      }
    }

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

    var api_url = "https://" + user.storeName + "/admin/api/2019-07/graphql.json";
    try {
      const response = await Fetch_GraphQL(api_url, NEW_PRODCUT, user.storeAccessToken);
      
      // Add this product to the user's products' list
      if (response.errors || response.data.productCreate.userErrors.length > 0) {
        return res.json({
          status: "failure",
          error: {
            message: "Error while adding to store"
          }
        });
      }

      var myProducts = user.myProducts;
      product_details.id = req.body.id;
      myProducts.push(product_details);
      importedProducts = user.importedProducts.filter(item => item.id !== req.body.id)
      
      user = await UserModel.updateOne({_id:req.user._id}, {myProducts, importedProducts});
      await OrderController.addOrders(import_id, product_details, user);
      return res.json({status : 'success'});
    }
    catch(err) {
      return res.json({
        status: "failure",
        error: {
          message: "Error while find on database"
        }
      });
    }
  }
}