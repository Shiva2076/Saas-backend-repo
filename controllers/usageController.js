const UsageService = require('../services/usageService');

const getUsageStats = async (req, res) => {
  try {
    // Add debug logging
    console.log(`Fetching stats for company ${req.user.company}, period ${req.query.period}`);
    
    const stats = await UsageService.getUsageStats(
      req.user.company, 
      req.query.period
    );
    
    // Debug log the results
    console.log('Stats query results:', stats);
    
    res.json(stats);
  } catch (err) {
    console.error('Error getting usage stats:', err);
    res.status(500).json({ 
      message: 'Failed to get usage statistics',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

const getUserUsage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const companyId = req.user.company;
    const { period = 'month' } = req.query;
    
    const usage = await UsageService.getUserUsage(userId, companyId, period);
    res.json(usage);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUsageStats,
  getUserUsage
};