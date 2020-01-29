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