import mongoose from 'mongoose';

const aiInteractionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['recommendation', 'analysis', 'motivation', 'pattern'], required: true },
  prompt: { type: String, required: true },
  response: { type: String, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

export default mongoose.model('AIInteraction', aiInteractionSchema);