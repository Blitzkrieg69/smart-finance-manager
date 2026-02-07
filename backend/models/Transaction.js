const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Standard Fields
  title: { type: String, default: "Untitled" }, 
  description: { type: String }, 
  amount: { type: Number, required: true },
  type: { type: String, required: true }, // 'income' or 'expense'
  category: { type: String, default: "Others" },
  date: { type: Date, default: Date.now },
  
  // --- RECURRENCE FIELDS (The "Robot" needs these) ---
  recurrence: { type: String, default: 'None' }, // "None", "Daily", "Weekly", "Monthly", "Yearly"
  nextDate: { type: Date } // The date when the system should auto-create the next copy
}, { 
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
      ret.id = ret._id; // Ensures frontend sees 'id' instead of '_id'
      delete ret._id;
    }
  }
});

module.exports = mongoose.model('Transaction', TransactionSchema);