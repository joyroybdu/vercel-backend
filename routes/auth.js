import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, mobile: mobile || '', password: hash });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, mobile: user.mobile }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, mobile: user.mobile }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/me (protected)
router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

// PUT /api/auth/me (protected)
router.put('/me', requireAuth, async (req, res) => {
  const { name, email, mobile } = req.body;
  if (!name || !email) return res.status(400).json({ message: 'Name and email are required' });

  // Ensure email uniqueness if changing email
  const existing = await User.findOne({ email, _id: { $ne: req.userId } });
  if (existing) return res.status(409).json({ message: 'Email already in use' });

  const user = await User.findByIdAndUpdate(
    req.userId,
    { name, email, mobile: mobile || '' },
    { new: true }
  ).select('-password');

  res.json(user);
});

export default router;