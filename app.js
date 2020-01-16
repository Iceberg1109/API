const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passport = require('passport');
const app = express();
const cors = require('cors');
const config = require('./config/config');

const crypto = require('crypto');
const cookie = require('cookie');
const querystring = require('querystring');

const request = require('request-promise');

require('dotenv').config()

mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);
mongoose.set('useCreateIndex', true);
mongoose.connect(config.mongodb_url);
mongoose.connection.on('error', error => console.log(error) );
mongoose.Promise = global.Promise;

require('./config/passport');

app.use( bodyParser.urlencoded({ extended : false }) );
app.use(bodyParser.json());
app.use(cors());
app.options('*', cors());

const auth_routes = require('./routes/auth.route');
const secureRoute = require('./routes/main.route');
const nonce = require('nonce')();
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    next();
});
app.use('/auth', auth_routes);
//We plugin our jwt strategy as a middleware so only verified users can access this route
app.use('/api', passport.authenticate('jwt', { session : false }), secureRoute );

//Handle errors
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({ error : err });
});
const forwardingAddress = 'https://0b146ceb.ngrok.io';
const scopes = 'read_products';

app.get('/shopify', (req, res) => {
  const shop = req.query.shop;
  if (shop) {
    const state = nonce();
    const redirectUri = forwardingAddress + '/shopify/callback';
    const installUrl = 'https://' + shop +
      '/admin/oauth/authorize?client_id=' + process.env.SHOPIFY_APIKEY +
      '&scope=' + scopes +
      '&state=' + state +
      '&redirect_uri=' + redirectUri;

    res.cookie('state', state);
    res.redirect(installUrl);
  } else {
    return res.status(400).send('Missing shop parameter. Please add ?shop=your-development-shop.myshopify.com to your request');
  }
});

app.get('/shopify/callback', (req, res) => {
  // console.log(req.query);
  const { shop, hmac, code, state } = req.query;
  // const stateCookie = cookie.parse(req.headers.cookie).state;
  // console.log("CALLBACK RESPONSE",req.query);

  // if (state !== stateCookie) {
  //   return res.status(403).send('Request origin cannot be verified');
  // }
  console.log(shop, hmac,code, state);
  if (shop && hmac && code) {
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

    // if (!hashEquals) {
    //   console.log("HMAC failed");
    //   return res.status(400).send('HMAC validation failed');
    // }

    // DONE: Exchange temporary code for a permanent access token
    const accessTokenRequestUrl = 'https://' + shop + '/admin/oauth/access_token';
    const accessTokenPayload = {
      client_id: process.env.SHOPIFY_APIKEY,
      client_secret: process.env.SHOPIFY_APISECRET,
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
      .then((shopResponse) => {
        res.status(200).end(shopResponse);
      })
      .catch((error) => {
        console.log(error);
        res.status(error.statusCode).send(error.error.error_description);
      });

    })
    .catch((error) => {
      console.log(error);
      res.status(error.statusCode).send(error.error.error_description);
    });

  } else {
    res.status(400).send('Required parameters missing');
  }
});


app.listen(8001, () => {
  console.log('Server started');
});