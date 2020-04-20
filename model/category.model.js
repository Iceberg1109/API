/*
 * The Category Model
 * title: the product id of the order, get the sku
*/
const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const CategorySchema = new Schema({
  title : {
    type : String,
    required : true,
  }
});

const CategoryModel = mongoose.model('category', CategorySchema);

module.exports = CategoryModel;