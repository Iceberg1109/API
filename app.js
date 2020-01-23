const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const passport = require("passport");
const app = express();
const cors = require("cors");
const querystring = require("querystring");
const crypto = require("crypto");
const request = require("request-promise");

// DotEnv config
require("dotenv").config();

// MongoDB config
mongoose.set("useNewUrlParser", true);
mongoose.set("useUnifiedTopology", true);
mongoose.set("useCreateIndex", true);
mongoose.connect(process.env.MONGODB_URL);
mongoose.connection.on("error", error => console.log(error));
mongoose.Promise = global.Promise;

// Passport fot authentication and authorization
require("./config/passport");

app.use( bodyParser.urlencoded({ extended : false }) );
app.use(bodyParser.json({
  type:'*/*',
  limit: '50mb',
  verify: function(req, res, buf) {
      if (req.url.startsWith('/normal/order/')){
        req.rawbody = buf;
      }
  }
}));
app.use(cors());
app.options("*", cors());

// Main Routing
const auth_routes   = require('./routes/auth.route'); // Authentication Routes
const normal_routes = require('./routes/normal.route'); // Routes, don't need authorization
const admin_route   = require('./routes/admin.route'); // Admin Routes, need authorization
const app_route     = require('./routes/main.route'); // Routes, need authorization

const nonce = require('nonce')();
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    next();
});
// These routes don't require authorization
app.use('/auth', auth_routes);
app.use('/normal', normal_routes);
//We plugin our jwt strategy as a middleware so only verified users can access this route
app.use('/admin/api/', passport.authenticate('jwt', { session : false }), admin_route );
app.use('/api/', passport.authenticate('jwt', { session : false }), app_route );

//Shopify essential info
const forwardingAddress = process.env.BACKEND_URL;
const apiKey = process.env.SHOPIFY_PARTNER_APIKEY;
const apiSecret = process.env.SHOPIFY_PARTNER_APISECRET;
const scopes = ["read_products", "write_products"];
//

app.get("/shopify", async (req, res) => {
  //save shop and email in 'user' table
  const shop = req.query.shop;
  const email = req.query.email;

  var user = await UserModel.updateOne({email}, {storeName: shop}, function(err, doc) {
    if (err) console.log(err);
  });

  console.log(shop, email);
  if (shop) {
    const state = nonce();
    const redirectUri = forwardingAddress + "/shopify/callback";
    const installUrl =
      "https://" +
      shop +
      "/admin/oauth/authorize?client_id=" +
      apiKey +
      "&scope=" +
      scopes +
      "&state=" +
      state +
      "&redirect_uri=" +
      redirectUri;

    res.cookie("state", state);
    res.redirect(installUrl);
  } else {
    return res
      .status(400)
      .send(
        "Missing shop parameter. Please add ?shop=your-development-shop.myshopify.com to your request"
      );
  }
});

app.get("/shopify/callback", (req, res) => {
  // console.log(req.query);
  const { shop, hmac, code, state } = req.query;
  console.log("HEADERS!!!!", req.headers, req.query);
  const stateCookie = cookie.parse(req.headers.cookie).state;
  if (state !== stateCookie) {
    return res.status(403).send("Request origin cannot be verified");
  }

  if (shop && hmac && code) {
    // DONE: Validate request is from Shopify
    const map = Object.assign({}, req.query);
    delete map["signature"];
    delete map["hmac"];
    const message = querystring.stringify(map);
    const providedHmac = Buffer.from(hmac, "utf-8");
    const generatedHash = Buffer.from(
      crypto
        .createHmac("sha256", apiSecret)
        .update(message)
        .digest("hex"),
      "utf-8"
    );
    let hashEquals = false;

    try {
      hashEquals = crypto.timingSafeEqual(generatedHash, providedHmac);
    } catch (e) {
      hashEquals = false;
    }

    if (!hashEquals) {
      return res.status(400).send("HMAC validation failed");
    }

    // DONE: Exchange temporary code for a permanent access token
    const accessTokenRequestUrl =
      "https://" + shop + "/admin/oauth/access_token";
    const accessTokenPayload = {
      client_id: apiKey,
      client_secret: apiSecret,
      code
    };
    const { FRONT_URL } = process.env;
    request
      .post(accessTokenRequestUrl, { json: accessTokenPayload })
      .then(async accessTokenResponse => {
        const accessToken = accessTokenResponse.access_token;
        await UserModel.updateOne({storeName: shop}, {storeAccessToken: accessToken}, function(err, doc) {
          if (err) console.log(err);
        });
        //save variables: accessToken, shop
        res.redirect(
          // "http://localhost:3000/shopify/callback?accesstoken=" + accessToken
          FRONT_URL + "/shopify/callback?shop=" + shop
        );
      })
      .catch(error => {
        res.status(error.statusCode).send(error.error.error_description);
      });
  } else {
    res.status(400).send("Required parameters missing");
  }
});

//Handle errors
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({ error : err });
});

app.listen(8001, () => {
  console.log('Server started');
});
