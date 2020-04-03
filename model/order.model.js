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