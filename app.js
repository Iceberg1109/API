const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passport = require('passport');
const app = express();
const cors = require('cors');

require('dotenv').config()

mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);
mongoose.set('useCreateIndex', true);
mongoose.connect(process.env.MONGODB_URL);
mongoose.connection.on('error', error => console.log(error) );
mongoose.Promise = global.Promise;

require('./config/passport');

app.use( bodyParser.urlencoded({ extended : false }) );
app.use(bodyParser.json());
app.use(cors());
app.options('*', cors());

const auth_routes = require('./routes/auth.route');
const admin_route = require('./routes/admin.route');
const app_route = require('./routes/main.route');
const nonce = require('nonce')();
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    next();
});
app.use('/auth', auth_routes);
//We plugin our jwt strategy as a middleware so only verified users can access this route
app.use('/admin/api/', passport.authenticate('jwt', { session : false }), admin_route );
app.use('/api/', passport.authenticate('jwt', { session : false }), app_route );

//Handle errors
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({ error : err });
});

app.listen(8001, () => {
  console.log('Server started');
});