import { Router } from 'express';
import Task from '../models/Task.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/tasks - Get all tasks for the authenticated user
router.get('/', requireAuth, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/tasks - Create a new task
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, description, dueDate } = req.body;
    
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const task = await Task.create({
      title,
      description: description || '',
      dueDate: dueDate || null,
      userId: req.userId
    });

    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/tasks/:id - Update a task
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { title, description, dueDate, completed } = req.body;
    const task = await Task.findOne({ _id: req.params.id, userId: req.userId });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (dueDate !== undefined) task.dueDate = dueDate;
    
    // Handle completion status
    if (completed !== undefined) {
      task.completed = completed;
      task.completedAt = completed ? new Date() : null;
    }

    await task.save();
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;