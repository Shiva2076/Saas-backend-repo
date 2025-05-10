// controllers/userController.js
const User = require('../models/User');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, email },
      { new: true, runValidators: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getUsage = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('usage')
      .populate('company', 'plan monthlyUsage');
    
    res.json({
      usage: user.usage,
      companyPlan: user.company.plan,
      monthlyUsage: user.company.monthlyUsage
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};