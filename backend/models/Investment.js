const mongoose = require('mongoose');

const InvestmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  name: { type: String, required: true },
  ticker: { type: String, required: true, uppercase: true }, // e.g., AAPL, BTC-USD
  category: { type: String, required: true }, // Stock, Crypto, Gold, etc.
  
  // Important Numbers
  quantity: { type: Number, required: true },
  buy_price: { type: Number, required: true },
  current_price: { type: Number, required: true },
  
  exchange: { type: String, default: 'Unknown' },
  currency: { type: String, default: 'USD' },
  
  date: { type: String } // "YYYY-MM-DD"
}, { 
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret._id;
    }
  }
});

module.exports = mongoose.model('Investment', InvestmentSchema);