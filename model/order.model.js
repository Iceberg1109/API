/*
 * The Order Model
 * product_id: the product id of the order, get the sku
 * sku:        the sku of the variant
 * quantity:   the variant quantity
 * client:     the shopify store owner infomation, contains email, name and store
 * shippingAddress: The shipping address of the variant, added by the store owner manually
 * price:       the original price of the variant
*/
const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const OrderSchema = new Schema({
  product_id : {
    type : String,
    required : true,
  },
  sku : {
    type : String,
    required : true,
  },
  quantity : {
    type : Number,
  },
  client: {
    type: Object
  },
  shippingAddress: {
    type: Object
  },
  price: {
    type: Number
  },
  status: {
    type: String
  }
});

const OrderModel = mongoose.model('order', OrderSchema);

module.exports = OrderModel;