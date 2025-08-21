import mongoose from 'mongoose';


const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  amount: { type: Number, required: true, min: 0 },
  category: { type: String, required: true },
  description: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  isRecurring: { type: Boolean, default: false },
  recurringFrequency: { 
    type: String, 
    enum: ['daily', 'weekly', 'monthly', 'yearly', 'none'], 
    default: 'none' 
  },
  source: { type: String, default: '' } // For income sources or expense payees
}, { timestamps: true });

export default mongoose.model('Transaction', transactionSchema);