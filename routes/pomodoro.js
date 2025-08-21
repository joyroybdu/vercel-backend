import { Router } from 'express';
import Pomodoro from '../models/Pomodoro.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/pomodoro/stats - Get user's pomodoro statistics
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Today's pomodoros
    const todayPomodoros = await Pomodoro.find({
      userId: req.userId,
      completedAt: { $gte: today, $lt: tomorrow }
    });
    
    // All-time stats
    const allPomodoros = await Pomodoro.find({ userId: req.userId });
    const workPomodoros = allPomodoros.filter(p => p.type === 'work');
    
    const totalWorkTime = workPomodoros.reduce((sum, p) => sum + p.duration, 0);
    const totalPomodoros = workPomodoros.length;
    
    res.json({
      today: todayPomodoros.length,
      totalPomodoros,
      totalWorkTime: Math.floor(totalWorkTime / 60), // in minutes
      todayPomodoros
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/pomodoro - Save a completed pomodoro session
router.post('/', requireAuth, async (req, res) => {
  try {
    const { type, duration, tasks } = req.body;
    
    const pomodoro = await Pomodoro.create({
      userId: req.userId,
      type,
      duration,
      tasks: tasks || []
    });
    
    res.status(201).json(pomodoro);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;