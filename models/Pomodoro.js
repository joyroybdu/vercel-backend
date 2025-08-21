import mongoose from 'mongoose';

const pomodoroSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['work', 'shortBreak', 'longBreak'], required: true },
  duration: { type: Number, required: true }, // in seconds
  completedAt: { type: Date, default: Date.now },
  tasks: [{ type: String }]
}, { timestamps: true });

export default mongoose.model('Pomodoro', pomodoroSchema);