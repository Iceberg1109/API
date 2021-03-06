/*
 * The Product Model
 * name:     the name of the user
 * email:    the email address of the uesr
 * password: the password address of the user
 * storeName: the shopify store name of the user
 * storeAccessToken: the shopify store access token, get when user attaches the store
 * importedProducts: the imported products array
 * myProducts: the array of products added to the shopify store
 * priceRule:  the normal price rule
 * salePriceRule: the sale price rule
 * resetPasswordToken: the reset password token, it is sent by email when user tries to reset the password
 * resetPasswordExpires: the reset password token expiration time
 * isAdmin: if the user is admin
*/
const mongoose = require('mongoose')
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name : {
    type : String,
    required : true,
  },
  email : {
    type : String,
    required : true,
    unique : true
  },
  password : {
    type : String,
    required : true 
  },
  storeName : {
    type : String,
    required : false 
  },
  storeAccessToken : {
    type : String,
    required : false 
  },
  importedProducts: {
    type : Array,
    required : false 
  },
  myProducts: {
    type : Array,
    required : false 
  },
  priceRule: {
    type: Number,
    required: true
  },
  salePriceRule: {
    type: Number,
    required: true
  },
  resetPasswordToken : {
    type : String,
    required : false,
  },
  resetPasswordExpires : {
    type: Date,
    required: false,
  },
  isAdmin: {
    type: Boolean,
    required: true,
  }
});

//This is called a pre-hook, before the user information is saved in the database
//this function will be called, we'll get the plain text password, hash it and store it.
UserSchema.pre('save', async function(next){
  //'this' refers to the current document about to be saved
  const user = this;
  //Hash the password with a salt round of 10, the higher the rounds the more secure, but the slower
  //your application becomes.
  const hash = await bcrypt.hash(this.password, 10);
  //Replace the plain text password with the hash and then store it
  this.password = hash;
  //Indicates we're done and moves on to the next middleware
  next();
});

//We'll use this later on to make sure that the user trying to log in has the correct credentials
UserSchema.methods.isValidPassword = async function(password){
  const user = this;
  //Hashes the password sent by the user for login and checks if the hashed password stored in the 
  //database matches the one sent. Returns true if it does else false.
  const compare = await bcrypt.compare(password, user.password);
  return compare;
}

const UserModel = mongoose.model('user',UserSchema);

module.exports = UserModel;