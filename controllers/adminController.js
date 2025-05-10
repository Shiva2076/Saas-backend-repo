// controllers/adminController.js
const User = require('../models/User');
const Company = require('../models/Company');

exports.listUsers = async (req, res) => {
  try {
    const users = await User.find({ company: req.user.company })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.promoteUser = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      company: req.user.company
    });

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.role = 'admin';
    await user.save();

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getStats = async (req, res) => {
  try {
    const company = await Company.findById(req.user.company)
      .populate('users', 'name email role');
    
    res.json({
      userCount: company.users.length,
      adminCount: company.users.filter(u => u.role === 'admin').length,
      monthlyUsage: company.monthlyUsage
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};