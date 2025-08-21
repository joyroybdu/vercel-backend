
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import moneyRoutes from './routes/money.js';
import notesRoutes from './routes/notes.js';
import pomodoroRoutes from './routes/pomodoro.js';

import taskRoutes from './routes/tasks.js'; // Add this import
import habitRoutes from './routes/habits.js';
import wordToPdfRoutes from './routes/wordToPdf.js';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL?.split(',') || '*',
  credentials: true,
}));

app.get('/', (_req, res) => {
  res.json({ ok: true, message: 'API running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes); 
app.use('/api/money', moneyRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/pomodoro', pomodoroRoutes);
app.use('/api/habits', habitRoutes);


app.use('/uploads', express.static('uploads'));

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
    const port = process.env.PORT || 5000;
    app.listen(port, () => console.log(`Server listening on ${port}`));
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
};

start();