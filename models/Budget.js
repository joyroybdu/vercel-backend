import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  period: { type: String, enum: ['weekly', 'monthly', 'yearly'], default: 'monthly' },
  active: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Budget', budgetSchema);