const mongoose = require('mongoose');

const InvestmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  name: { type: String, required: true },
  ticker: { type: String, required: true, uppercase: true }, // display ticker (AAPL, RELIANCE.NS, BTC)
  category: { type: String, required: true }, // Stock, Crypto

  // Multi-provider support
  provider: { type: String, required: true, enum: ['finnhub', 'nse', 'yahoo', 'alphavantage'] }, // ✅ FIXED
  providerId: { type: String, required: true }, // Provider-specific symbol

  // Important Numbers
  quantity: { type: Number, required: true },
  buy_price: { type: Number, required: true },
  current_price: { type: Number, required: true },

  exchange: { type: String, default: '' }, // empty for crypto
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
