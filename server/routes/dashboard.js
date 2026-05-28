const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const StudyData = require('../models/StudyData');

// @route   GET /api/dashboard
// @desc    Get the authenticated user's study planner data
// @access  Private (Protected by JWT)
router.get('/', auth, async (req, res) => {
  try {
    const dashboardData = await StudyData.findOne({ userId: req.user.id });

    // If no document exists, return a default clean structure
    if (!dashboardData) {
      return res.json({
        userId: req.user.id,
        tasks: [],
        pomodoroSettings: {
          workDuration: 1500,
          breakDuration: 300
        }
      });
    }

    return res.json(dashboardData);
  } catch (err) {
    console.error(`GET /api/dashboard error: ${err.message}`);
    return res.status(500).json({ msg: 'Server error fetching study planner data' });
  }
});

// @route   POST /api/dashboard
// @desc    Create or update the authenticated user's study planner data
// @access  Private (Protected by JWT)
router.post('/', auth, async (req, res) => {
  const { tasks, pomodoroSettings } = req.body;

  try {
    // Find the document by userId and update it, or create a new one if it doesn't exist
    const updatedData = await StudyData.findOneAndUpdate(
      { userId: req.user.id },
      {
        $set: {
          tasks: tasks || [],
          pomodoroSettings: pomodoroSettings || { workDuration: 1500, breakDuration: 300 }
        }
      },
      { new: true, upsert: true, runValidators: true }
    );

    return res.json(updatedData);
  } catch (err) {
    console.error(`POST /api/dashboard error: ${err.message}`);
    return res.status(500).json({ msg: 'Server error saving study planner data' });
  }
});

module.exports = router;
