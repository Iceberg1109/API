
var port = 433;
var frontport = 433;
var host_url = `192.168.11.17`;
// var host_url = `exploreodin.com`;
var default_auth_email = "smartdev951109@gmail.com"
var default_auth_password = "jinxiansong1109"

module.exports = {
  mongodb_url:`mongodb://127.0.0.1:27017/shopify-back`,
  front_url: `https://localhost:3000`,
  email: {
    auth_email: function () {
      return default_auth_email;
    },
    auth_password: function () {
      return default_auth_password;
    }
  }
};