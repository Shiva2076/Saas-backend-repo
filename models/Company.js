const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  plan: {
    type: String,
    enum: ['free', 'pro', 'enterprise'],
    default: 'free',
    required: true
  },
  monthlyUsage: {
    type: Number,
    default: 0
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

CompanySchema.pre('save', function(next) {
  if (this.isModified('plan')) {
    switch (this.plan) {
      case 'pro':
        this.monthlyLimit = 500;
        break;
      case 'enterprise':
        this.monthlyLimit = Infinity;
        break;
      default: // free
        this.monthlyLimit = 100;
    }
  }
  next();
});

module.exports = mongoose.model('Company', CompanySchema);