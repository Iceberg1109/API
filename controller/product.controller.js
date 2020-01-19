TopClient = require('node-taobao-topclient').default;

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
    var client = new TopClient({
      'appkey': process.env.Ali_APPKEY,
      'appsecret': process.env.Ali_APPSECRET,
      'REST_URL': 'http://gw.api.taobao.com/router/rest'
    });
    
    client.execute('aliexpress.postproduct.redefining.findaeproductbyidfordropshipper', {
      product_id,
      // 'local_country':'RU',
      // 'local_language':'ru'
    }, function(error, response) {
      if (!error) console.log(response);
      else console.log(error);
    })
  },
  addProduct: async function  (req, res) {
    title = req.body.title;
    descriptionHtml = req.body.descriptionHtml;
    images =  req.body.images;
    options =  req.body.options;
    variants =  req.body.variants;
    console.log("Add product", title, descriptionHtml, images, options, variants);

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
        title,
        descriptionHtml,
        images,
        options,
        variants
      }
    });
    var user = await UserModel.findById(req.user._id);

    var api_url = "http://" + user.storeName + ".myshopify.com//admin/api/2019-07/graphql.json";
    const response = await this.Fetch_GraphQL(api_url, NEW_PRODCUT);
    // console.log(response);
  }
}