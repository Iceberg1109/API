const passport = require('passport');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const UserModel = require('../model/user.model');
var async = require('async');

var  hbs = require('nodemailer-express-handlebars');
var crypto = require('crypto');
var bcrypt = require('bcrypt');

Fetch_GraphQL = async fields => {
  const response = await fetch(
    `https://http://uds-dropshippingstore.myshopify.com//admin/api/2019-07/graphql.json`,
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
  addProduct: async function  (req, res) {
    title = req.body.title;
    description = req.body.description;

    console.log("Add product", title, description);

    const UPDATE_METAFIELDS = JSON.stringify({
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
        input: {
          title,
          descriptionHtml: description,
          options : ["Size", "Color"],
          variants: [
            {price: "25", options : ["42", "blue"]},
            {price: "25", options : ["42", "red"]},
          ]
        }
      }
    });

    // const response = await this.Fetch_GraphQL(UPDATE_METAFIELDS);
    console.log(response);
  }
}