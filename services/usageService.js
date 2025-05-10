const Company = require('../models/Company');
const UsageLog = require('../models/UsageLog');

class UsageService {
  async checkUsageLimit(companyId) {
    // Get company with plan information
    const company = await Company.findById(companyId).select('plan monthlyUsage monthlyLimit');
    if (!company) {
      throw new Error('Company not found');
    }

    // Enterprise plan has unlimited usage
    if (company.plan === 'enterprise') {
      return {
        allowed: true,
        remaining: Infinity,
        monthlyLimit: Infinity,
        actualUsage: company.monthlyUsage,
        plan: company.plan
      };
    }

    // Get current month's usage from logs (more accurate than counter)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const actualUsage = await UsageLog.countDocuments({
      company: companyId,
      timestamp: { $gte: startOfMonth },
      status: 'success'
    });

    // Determine limits based on plan
    let monthlyLimit;
    switch (company.plan) {
      case 'pro':
        monthlyLimit = 500;
        break;
      case 'free':
        monthlyLimit = 100;
        break;
      default:
        monthlyLimit = 100; // default
    }

    const remaining = monthlyLimit - actualUsage;
    const allowed = remaining > 0;

    return {
      allowed,
      remaining,
      monthlyLimit,
      actualUsage,
      plan: company.plan
    };
  }
   async getUsageStats(companyId, period = 'month') {
  const company = await Company.findById(companyId).select('plan monthlyLimit');
  if (!company) {
    throw new Error('Company not found');
  }

  // Get date range with proper timezone handling
  const { startDate, endDate } = this.getDateRange(period);

  const stats = await UsageLog.aggregate([
    {
      $match: {
        company: company._id,
        timestamp: { 
          $gte: startDate,
          $lte: endDate 
        },
        status: 'success' // Ensure we only count successful requests
      }
    },
    {
      $group: {
        _id: '$toolName',
        count: { $sum: 1 },
        lastUsed: { $max: '$timestamp' }
      }
    },
    {
      $project: {
        toolName: '$_id',
        count: 1,
        lastUsed: 1,
        _id: 0
      }
    }
  ]);

  const totalUsage = stats.reduce((sum, tool) => sum + tool.count, 0);

  return {
    period,
    totalUsage,
    limit: company.monthlyLimit,
    remaining: company.plan === 'enterprise' ? Infinity : company.monthlyLimit - totalUsage,
    tools: stats
  };
}

// Improved date range calculation
getDateRange(period) {
  const now = new Date();
  const startDate = new Date(now);
  const endDate = new Date(now);

  switch (period.toLowerCase()) {
    case 'day':
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'week':
      startDate.setDate(now.getDate() - now.getDay());
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'month':
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setMonth(now.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    default:
      throw new Error('Invalid period specified');
  }

  return { startDate, endDate };
}

  async getUserUsage(userId, companyId, period = 'week') {
    const dateFilter = this.getDateFilter(period);

    return await UsageLog.find({
      user: userId,
      company: companyId,
      timestamp: dateFilter
    })
    .sort({ timestamp: -1 })
    .select('toolName prompt timestamp response')
    .lean();
  }

  // Helper method for date filtering
  getDateFilter(period) {
    const now = new Date();
    const filter = {};
    
    if (period === 'day') {
      filter.$gte = new Date(now.setHours(0, 0, 0, 0));
      filter.$lt = new Date(now.setHours(23, 59, 59, 999));
    } else if (period === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      filter.$gte = startOfWeek;
      filter.$lt = endOfWeek;
    } else { // month
      filter.$gte = new Date(now.getFullYear(), now.getMonth(), 1);
      filter.$lt = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }
    
    return filter;
  }
}

module.exports = new UsageService();
