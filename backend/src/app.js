const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Freelance Gig Marketplace API',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/gigs', require('./routes/gigRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/proposals', require('./routes/proposalRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/submissions', require('./routes/submissionRoutes'));
app.use('/api', require('./routes/workflowRoutes'));

app.use((err, req, res, next) => {
  console.error('❌', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

module.exports = app;