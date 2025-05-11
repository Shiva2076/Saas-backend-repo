const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const dotenv = require('dotenv');
const errorHandler = require('./utils/errorHandler');

dotenv.config();

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not defined in .env file');
  process.exit(1);
}

const app = express();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const authRoutes = require('./routes/authRoutes');
const toolRoutes = require('./routes/toolRoutes');
const usageRoutes = require('./routes/usageRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/tools', toolRoutes);
app.use('/api/usage', usageRoutes);

app.get('/', (req, res) => {
  res.send('SaaS Backend API is running');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

app.use(errorHandler);

module.exports = app;
