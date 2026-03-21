const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  category: { type: String, required: true },
  limit: { type: Number, required: true },
  period: { type: String, enum: ['Weekly', 'Monthly', 'Yearly'], default: 'Monthly' },
  spent: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Budget', BudgetSchema);
