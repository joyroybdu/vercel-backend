import { Router } from 'express';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import SavingsGoal from '../models/SavingsGoal.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Get dashboard summary
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let dateFilter = {};
    
    if (startDate && endDate) {
      dateFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      // Default to current month
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      dateFilter.date = { $gte: firstDay, $lte: lastDay };
    }

    const transactions = await Transaction.find({
      userId: req.userId,
      ...dateFilter
    });

    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const savings = income - expenses;
    
    // Category breakdown
    const expenseCategories = {};
    const incomeCategories = {};
    
    transactions.forEach(t => {
      if (t.type === 'expense') {
        expenseCategories[t.category] = (expenseCategories[t.category] || 0) + t.amount;
      } else {
        incomeCategories[t.category] = (incomeCategories[t.category] || 0) + t.amount;
      }
    });

    res.json({
      summary: { income, expenses, savings },
      expenseCategories,
      incomeCategories,
      transactions: transactions.slice(0, 10) // Recent transactions
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Transaction routes
router.get('/transactions', requireAuth, async (req, res) => {
  try {
    const { type, category, startDate, endDate, page = 1, limit = 20 } = req.query;
    let filter = { userId: req.userId };
    
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const transactions = await Transaction.find(filter)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
      
    const total = await Transaction.countDocuments(filter);
    
    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/transactions', requireAuth, async (req, res) => {
  try {
    const { type, amount, category, description, date, isRecurring, recurringFrequency, source } = req.body;
    
    if (!type || !amount || !category) {
      return res.status(400).json({ message: 'Type, amount and category are required' });
    }
    
    const transaction = await Transaction.create({
      userId: req.userId,
      type,
      amount: parseFloat(amount),
      category,
      description: description || '',
      date: date ? new Date(date) : new Date(),
      isRecurring: isRecurring || false,
      recurringFrequency: recurringFrequency || 'none',
      source: source || ''
    });
    
    res.status(201).json(transaction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/transactions/:id', requireAuth, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/transactions/:id', requireAuth, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Budget routes
router.get('/budgets', requireAuth, async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.userId, active: true });
    res.json(budgets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/budgets', requireAuth, async (req, res) => {
  try {
    const { category, amount, period } = req.body;
    
    if (!category || !amount) {
      return res.status(400).json({ message: 'Category and amount are required' });
    }
    
    // Check if budget already exists for this category
    const existingBudget = await Budget.findOne({
      userId: req.userId,
      category,
      active: true
    });
    
    if (existingBudget) {
      return res.status(409).json({ message: 'Budget already exists for this category' });
    }
    
    const budget = await Budget.create({
      userId: req.userId,
      category,
      amount: parseFloat(amount),
      period: period || 'monthly'
    });
    
    res.status(201).json(budget);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/budgets/:id', requireAuth, async (req, res) => {
  try {
    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    res.json(budget);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/budgets/:id', requireAuth, async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    res.json({ message: 'Budget deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Savings goals routes
router.get('/savings-goals', requireAuth, async (req, res) => {
  try {
    const goals = await SavingsGoal.find({ userId: req.userId });
    res.json(goals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/savings-goals', requireAuth, async (req, res) => {
  try {
    const { name, targetAmount, targetDate } = req.body;
    
    if (!name || !targetAmount) {
      return res.status(400).json({ message: 'Name and target amount are required' });
    }
    
    const goal = await SavingsGoal.create({
      userId: req.userId,
      name,
      targetAmount: parseFloat(targetAmount),
      targetDate: targetDate ? new Date(targetDate) : null
    });
    
    res.status(201).json(goal);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/savings-goals/:id', requireAuth, async (req, res) => {
  try {
    const goal = await SavingsGoal.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    
    if (!goal) {
      return res.status(404).json({ message: 'Savings goal not found' });
    }
    
    res.json(goal);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/savings-goals/:id', requireAuth, async (req, res) => {
  try {
    const goal = await SavingsGoal.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!goal) {
      return res.status(404).json({ message: 'Savings goal not found' });
    }
    
    res.json({ message: 'Savings goal deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reports
router.get('/reports', requireAuth, async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'category' } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    
    const transactions = await Transaction.find({
      userId: req.userId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    });
    
    // Generate report data
    const incomeByCategory = {};
    const expensesByCategory = {};
    const dailyData = {};
    
    transactions.forEach(t => {
      const dateStr = t.date.toISOString().split('T')[0];
      
      if (t.type === 'income') {
        incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
        dailyData[dateStr] = dailyData[dateStr] || { income: 0, expenses: 0 };
        dailyData[dateStr].income += t.amount;
      } else {
        expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
        dailyData[dateStr] = dailyData[dateStr] || { income: 0, expenses: 0 };
        dailyData[dateStr].expenses += t.amount;
      }
    });
    
    res.json({
      summary: {
        totalIncome: Object.values(incomeByCategory).reduce((sum, val) => sum + val, 0),
        totalExpenses: Object.values(expensesByCategory).reduce((sum, val) => sum + val, 0),
        net: Object.values(incomeByCategory).reduce((sum, val) => sum + val, 0) - 
             Object.values(expensesByCategory).reduce((sum, val) => sum + val, 0)
      },
      incomeByCategory,
      expensesByCategory,
      dailyData
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;