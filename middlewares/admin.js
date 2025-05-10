const User = require('../models/User');

const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Admin access required',
        requiredRole: 'admin',
        currentRole: user.role
      });
    }
    
    next();
  } catch (err) {
    console.error('Admin check error:', err);
    res.status(500).json({ message: 'Server error during admin verification' });
  }
};

module.exports = requireAdmin;