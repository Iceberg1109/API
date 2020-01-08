const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passport = require('passport');
const app = express();
const UserModel = require('./model/model');

mongoose.connect('mongodb://127.0.0.1:27017/passport-jwt', { useMongoClient : true });
mongoose.connection.on('error', error => console.log(error) );
mongoose.Promise = global.Promise;

require('./config/passport');

app.use( bodyParser.urlencoded({ extended : false }) );

const auth_routes = require('./routes/auth');
const secureRoute = require('./routes/route');

app.use('/', auth_routes);
//We plugin our jwt strategy as a middleware so only verified users can access this route
app.use('/api', passport.authenticate('jwt', { session : false }), secureRoute );

//Handle errors
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({ error : err });
});

app.listen(3000, () => {
  console.log('Server started');
});