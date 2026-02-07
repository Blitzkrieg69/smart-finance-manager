const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
  category: { type: String, required: true },
  limit: { type: Number, required: true },
  spent: { type: Number, default: 0 }, // We will calculate this later
}, { timestamps: true });

module.exports = mongoose.model('Budget', BudgetSchema);