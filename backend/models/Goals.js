const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  name: { type: String, required: true },
  target_amount: { type: Number, required: true },
  saved_amount: { type: Number, default: 0 },
  deadline: { type: String, required: true }, // Format: YYYY-MM-DD
  color: { type: String, default: '#6366f1' }, // Hex color for UI
  
  description: { type: String },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
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

// Virtual field to calculate progress percentage
GoalSchema.virtual('progress').get(function() {
  return Math.min((this.saved_amount / this.target_amount) * 100, 100).toFixed(2);
});

// Virtual field to check if goal is achieved
GoalSchema.virtual('isAchieved').get(function() {
  return this.saved_amount >= this.target_amount;
});

// Virtual field to calculate remaining amount
GoalSchema.virtual('remaining').get(function() {
  return Math.max(this.target_amount - this.saved_amount, 0);
});

module.exports = mongoose.model('Goal', GoalSchema);
