const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const OrderSchema = new Schema({
  type : {
    type : String,
    required : true,
  },
  id : {
    type : String,
    required : true,
  },
  quantity : {
    type : Number,
    required : true 
  },
  storeName: {
    type : String,
    required : true,
  },
  isShipped: {
    type: Boolean,
  }
});

const OrderModel = mongoose.model('order', OrderSchema);

module.exports = OrderModel;