import mongoose from 'mongoose';

const habitSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  type: { type: String, enum: ['positive', 'negative'], required: true },
  frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' },
  goal: { type: String, default: '' }, // e.g., "3 times per week"
  streak: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  completionDates: [{ type: Date }],
  reminder: {
    enabled: { type: Boolean, default: false },
    time: { type: String, default: '09:00' }
  }
}, { timestamps: true });

export default mongoose.model('Habit', habitSchema);