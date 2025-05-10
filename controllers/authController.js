const User = require('../models/User');
const Company = require('../models/Company');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, name, companyName, plan = 'free' } = req.body;

  try {
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    const company = new Company({
      name: companyName,
      plan,
      monthlyUsage: 0
    });
    await company.save();

    const user = new User({
      email,
      password,
      name,
      role: 'admin',
      company: company._id,
      isActive: true
    });
    await user.save();

    company.admin = user._id;
    await company.save();

    const token = jwt.sign(
      {
        user: {
          id: user.id,
          role: user.role,
          company: user.company
        }
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: {
          id: company._id,
          name: company.name,
          plan: company.plan
        }
      }
    });

  } catch (err) {
    console.error('Registration error:', err);
    
    if (company && company._id) {
      await Company.deleteOne({ _id: company._id }).catch(e => console.error('Cleanup error:', e));
    }
    if (user && user._id) {
      await User.deleteOne({ _id: user._id }).catch(e => console.error('Cleanup error:', e));
    }

    res.status(500).json({ 
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).populate('company');
    if (!user || !user.isActive) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    user.lastActive = new Date();
    await user.save();

    const token = jwt.sign(
      {
        user: {
          id: user.id,
          role: user.role,
          company: user.company._id
        }
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ 
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('company');
      
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('Get current user error:', err);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser
};