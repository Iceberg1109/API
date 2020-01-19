var bcrypt = require('bcrypt');
const UserModel = require('../model/user.model');

module.exports = {
  getUserInfo: function (req, res, next) {
    UserModel.findById(req.user._id, 'name email', function (err, user) {
      if (err) return res.json({status: "no user"});
      console.log("get", user);
      return res.json({
        name: user.name,
        email: user.email,
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
  connectStore: function(req, res) {
    // const { shop, hmac, code, state } = req.query;
    const shop = req.body.shop;
    const code = req.body.code;

    console.log(shop, code, req.user._id);
    if (shop && code) {
      // DONE: Validate request is from Shopify
      const map = Object.assign({}, req.query);
      delete map['signature'];
      delete map['hmac'];
      const message = querystring.stringify(map);
      const providedHmac = Buffer.from(hmac, 'utf-8');
      const generatedHash = Buffer.from(
        crypto
          .createHmac('sha256', apiSecret)
          .update(message)
          .digest('hex'),
          'utf-8'
        );
      let hashEquals = false;

      try {
        hashEquals = crypto.timingSafeEqual(generatedHash, providedHmac)
      } catch (e) {
        hashEquals = false;
      };

      const accessTokenRequestUrl = 'https://' + shop + '/admin/oauth/access_token';
      const accessTokenPayload = {
        client_id: process.env.SHOPIFY_PARTNER_APIKEY,
        client_secret: process.env.SHOPIFY_PARTNER_APISECRET,
        code,
      };
      console.log(accessTokenPayload, accessTokenRequestUrl);
      request.post(accessTokenRequestUrl, { json: accessTokenPayload })
      .then((accessTokenResponse) => {
        const accessToken = accessTokenResponse.access_token;
        // DONE: Use access token to make API call to 'shop' endpoint
        const shopRequestUrl = 'https://' + shop + '/admin/api/2020-01/shop.json';
        const shopRequestHeaders = {
          'X-Shopify-Access-Token': accessToken,
        };

        request.get(shopRequestUrl, { headers: shopRequestHeaders })
        .then( async (shopResponse) => {
          console.log(shopResponse);
          var user = await UserModel.updateOne({_id:req.user._id}, {shopifyToken: accessToken}, function(err, doc) {
            if (err) return res.json({status : 'failed'});
            return res.json({status : 'success'});
          });
        })
        .catch((error) => {
          console.log(error);
          res.json({status: "failed", err: error.error.error_description});
        });

      })
      .catch((error) => {
        console.log(error);
        res.json({status: "failed", err: error.error.error_description});
      });

    } else {
      res.status(400).send('Required parameters missing');
    }
  }
}