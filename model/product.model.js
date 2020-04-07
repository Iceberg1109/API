/*
 * The Product Model
 * category:   the category of the product
 * title:      the title of the product
 * descriptionHtml: the description of the product, written in HTML
 * images:     the images of the product
 * options:    the variant options, something like color, size, etc...
 * variants:   the variants of the product
 * importedCount: how many times the product is added the user's imported list
 * addedCount:    how many times the product is added the user's shopify store
 * soldCount:     how many times the product is sold
*/
const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
  category : {
    type : String,
    required : true,
  },
  title : {
    type : String,
    required : true,
  },
  descriptionHtml : {
    type : String,
    required : true,
  },
  images : {
    type : Array,
    required : true 
  },
  options : {
    type : Array,
    required : false 
  },
  variants : {
    type : Array,
    required : true 
  },
  importedCount: {
    type : Number,
    required : false 
  },
  addedCount: {
    type : Number,
    required : false 
  },
  soldCount: {
    type : Number,
    required : false 
  }
});

const ProductModel = mongoose.model('product',ProductSchema);

module.exports = ProductModel;