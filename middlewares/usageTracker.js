const Company = require('../models/Company');
const UsageLog = require('../models/UsageLog');


exports.checkUsageLimit = async (req, res, next) => {
  try {
    const company = req.user.company;
    
    const now = new Date();
    if (now >= company.resetDate) {
      const nextResetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      
      await Company.findByIdAndUpdate(company._id, {
        currentUsage: 0,
        resetDate: nextResetDate
      });
      
      company.currentUsage = 0;
      company.resetDate = nextResetDate;
    }
    
    if (company.plan !== 'enterprise' && company.currentUsage >= company.monthlyCap) {
      return res.status(403).json({
        success: false,
        message: `Monthly usage limit of ${company.monthlyCap} has been reached. Please upgrade your plan to continue.`,
        currentUsage: company.currentUsage,
        limit: company.monthlyCap,
        resetDate: company.resetDate
      });
    }
    
    next();
  } catch (error) {
    console.error('Error checking usage limit:', error);
    next(error);
  }
};


exports.logUsage = async (req, res, next) => {
  const startTime = Date.now();
  
  const originalEnd = res.end;
  
  res.end = async function(chunk, encoding) {
    originalEnd.call(this, chunk, encoding);
    
    try {
      const processingTime = Date.now() - startTime;
      
      // Create usage log
      const log = new UsageLog({
        user: req.user._id,
        company: req.user.company._id,
        toolName: req.body.toolName,
        prompt: req.body.prompt,
        processingTimeMs: processingTime,
        successful: res.statusCode >= 200 && res.statusCode < 300,
        ip: req.ip,
        errorMessage: res.statusCode >= 400 ? chunk.toString() : null
      });
      
      await log.save();
      
      await Company.findByIdAndUpdate(req.user.company._id, {
        $inc: { currentUsage: 1 }
      });
      
    } catch (error) {
      console.error('Error logging usage:', error);
     
    }
  };
  
  next();
};