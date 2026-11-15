const express = require('express');
const cors = require('cors');

const memberRoutes = require('./routes/memberRoutes');
const lockerRoutes = require('./routes/lockerRoutes');
const allotmentRoutes = require('./routes/allotmentRoutes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Standard middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root / Health check route
app.get('/', (req, res) => {
  res.status(200).json({
    project: 'FitNest Gym – Locker Room Management System',
    status: 'online',
    version: '1.0.0',
    documentation: {
      members: '/members',
      lockers: '/lockers',
      allotments: '/allotments',
      joinEndpoint: '/allotments/details'
    }
  });
});

// Mount Resource Routes
app.use('/members', memberRoutes);
app.use('/lockers', lockerRoutes);
app.use('/allotments', allotmentRoutes);

// Handle 404 Not Found
app.use(notFound);

// Centralized Error Handling
app.use(errorHandler);

module.exports = app;

