const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables from .env
dotenv.config();

// Connect to MongoDB Atlas
connectDB();

// Initialize Redis connection
require('./config/redis');


const app = express();

// Middleware Setup
// Enable CORS for all routes (configured for frontend to communicate)
app.use(cors());
// Parse incoming JSON payloads
app.use(express.json());

// Route Registrations
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Base/Health Check Route
app.get('/', (req, res) => {
  res.json({ status: 'success', message: 'StudyFlow API is active and running.' });
});

// Setup Port
const PORT = process.env.PORT || 5000;

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
