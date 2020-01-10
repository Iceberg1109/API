
var port = 433;
var frontport = 433;
var host_url = `192.168.11.17`;
// var host_url = `exploreodin.com`;
var default_auth_email = "smartdev951109@gmail.com"
var default_auth_password = "jinxiansong1109"

module.exports = {
  mongodb_url:`mongodb://localhost:27017/shopify-back`,
  // front_url: `http://localhost:3000`,
  front_url: `http://ec2-13-59-196-27.us-east-2.compute.amazonaws.com:5000`,
  email: {
    auth_email: function () {
      return default_auth_email;
    },
    auth_password: function () {
      return default_auth_password;
    }
  }
};
