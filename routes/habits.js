import { Router } from 'express';
import Habit from '../models/Habit.js';
import AIInteraction from '../models/AIInteraction.js';
import { requireAuth } from '../middleware/auth.js';
import DeepSeekService from '../services/deepseekService.js';

const router = Router();
const deepSeekService = new DeepSeekService(process.env.DEEPSEEK_API_KEY);

// GET /api/habits - Get all habits for user
router.get('/', requireAuth, async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(habits);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/habits - Create a new habit
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, description, type, frequency, goal, reminder } = req.body;
    
    const habit = await Habit.create({
      userId: req.userId,
      name,
      description,
      type,
      frequency,
      goal,
      reminder
    });
    
    res.status(201).json(habit);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/habits/:id - Update a habit
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }
    
    res.json(habit);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/habits/:id - Delete a habit
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const habit = await Habit.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }
    
    res.json({ message: 'Habit deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/habits/:id/complete - Mark habit as completed
router.post('/:id/complete', requireAuth, async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }
    
    // Add current date to completion dates
    habit.completionDates.push(new Date());
    
    // Update streak - simple implementation
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastCompletion = habit.completionDates[habit.completionDates.length - 2];
    if (lastCompletion && 
        lastCompletion.toDateString() === yesterday.toDateString()) {
      habit.streak += 1;
    } else if (habit.completionDates.length === 1) {
      habit.streak = 1;
    } else {
      habit.streak = 1; // Reset streak if not consecutive
    }
    
    await habit.save();
    res.json(habit);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/habits/ai/recommendations - Get AI habit recommendations
router.get('/ai/recommendations', requireAuth, async (req, res) => {
  try {
    const { goals } = req.query;
    
    if (!goals) {
      return res.status(400).json({ message: 'Goals parameter is required' });
    }
    
    // Get user's current habits to personalize recommendations
    const currentHabits = await Habit.find({ userId: req.userId });
    const habitNames = currentHabits.map(h => h.name);
    
    const recommendations = await deepSeekService.generateHabitRecommendations(
      goals, 
      habitNames
    );
    
    // Save this interaction
    await AIInteraction.create({
      userId: req.userId,
      type: 'recommendation',
      prompt: `Habit recommendations for goals: ${goals}`,
      response: JSON.stringify(recommendations),
      metadata: { goals, currentHabits: habitNames }
    });
    
    res.json(recommendations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to generate recommendations' });
  }
});

// GET /api/habits/ai/analysis - Get AI analysis of habit patterns
router.get('/ai/analysis', requireAuth, async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.userId });
    
    if (habits.length === 0) {
      return res.status(400).json({ message: 'No habits to analyze' });
    }
    
    // Prepare completion data for analysis
    const completions = habits.map(habit => ({
      name: habit.name,
      streak: habit.streak,
      completionCount: habit.completionDates.length,
      lastCompletion: habit.completionDates.length > 0 ? 
        habit.completionDates[habit.completionDates.length - 1] : null
    }));
    
    const analysis = await deepSeekService.analyzeHabitPatterns(habits, completions);
    
    // Save this interaction
    await AIInteraction.create({
      userId: req.userId,
      type: 'analysis',
      prompt: 'Habit pattern analysis',
      response: analysis,
      metadata: { habitsCount: habits.length }
    });
    
    res.json({ analysis });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to generate analysis' });
  }
});

// GET /api/habits/ai/motivation - Get AI motivational message
router.get('/ai/motivation', requireAuth, async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.userId });
    const completedCount = habits.reduce((count, habit) => 
      count + habit.completionDates.length, 0);
    const currentStreak = habits.reduce((max, habit) => 
      Math.max(max, habit.streak), 0);
    
    const progress = `You've completed ${completedCount} habit sessions with a current streak of ${currentStreak} days.`;
    const goals = habits.map(h => h.name).join(', ');
    
    const motivation = await deepSeekService.generateMotivationalMessage(progress, goals);
    
    // Save this interaction
    await AIInteraction.create({
      userId: req.userId,
      type: 'motivation',
      prompt: 'Generate motivational message',
      response: motivation,
      metadata: { completedCount, currentStreak }
    });
    
    res.json({ motivation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to generate motivation' });
  }
});

export default router;