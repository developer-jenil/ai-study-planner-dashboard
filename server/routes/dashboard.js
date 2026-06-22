const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const StudyData = require('../models/StudyData');
const redisClient = require('../config/redis');

// @route   GET /api/dashboard
// @desc    Get the authenticated user's study planner data
// @access  Private (Protected by JWT)
router.get('/', auth, async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    let offset = req.query.offset ? parseInt(req.query.offset) : 0;
    if (isNaN(offset) || offset < 0) offset = 0;

    const limitStr = (limit !== null && !isNaN(limit)) ? limit : 'none';
    const cacheKey = `user:dashboard:${req.user.id}:${limitStr}:${offset}`;

    // Try to retrieve cached dashboard data from Redis
    try {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }
    } catch (redisErr) {
      console.error('Redis GET dashboard failed:', redisErr.message);
    }

    let projection = {
      tasks: 1,
      userId: 1,
      pomodoroSettings: 1,
      _id: 1
    };
    let totalTasks = undefined;

    if (limit !== null && !isNaN(limit) && limit >= 0) {
      const countDoc = await StudyData.findOne({ userId: req.user.id }, { tasks: 1 });
      totalTasks = countDoc && countDoc.tasks ? countDoc.tasks.length : 0;

      projection.tasks = { $slice: [offset, limit] };
    }

    const dashboardData = await StudyData.findOne({ userId: req.user.id }, projection).populate('userId', 'email');

    // If no document exists, return a default clean structure
    if (!dashboardData) {
      const defaultData = {
        userId: req.user.id,
        tasks: [],
        pomodoroSettings: {
          workDuration: 1500,
          breakDuration: 300
        }
      };

      // Cache the default data structure
      try {
        await redisClient.set(cacheKey, JSON.stringify(defaultData), { EX: 3600 });
      } catch (redisErr) {
        console.error('Redis SET default dashboard failed:', redisErr.message);
      }

      return res.json(defaultData);
    }

    let responseData = dashboardData;
    if (totalTasks !== undefined) {
      responseData = dashboardData.toJSON();
      responseData.pagination = {
        totalTasks,
        limit,
        offset
      };
    }

    // Cache the retrieved dashboard data in Redis (expires in 1 hour)
    try {
      await redisClient.set(cacheKey, JSON.stringify(responseData), { EX: 3600 });
    } catch (redisErr) {
      console.error('Redis SET dashboard failed:', redisErr.message);
    }

    return res.json(responseData);
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

    // Invalidate all Redis dashboard cache keys for this user
    try {
      let cursor = '0';
      const pattern = `user:dashboard:${req.user.id}:*`;
      do {
        const reply = await redisClient.scan(cursor, { MATCH: pattern, COUNT: 100 });
        cursor = reply.cursor;
        const keys = reply.keys;
        if (keys && keys.length > 0) {
          await redisClient.del(keys);
        }
      } while (cursor !== '0');
    } catch (redisErr) {
      console.error('Redis cache invalidation failed:', redisErr.message);
    }

    return res.json(updatedData);
  } catch (err) {
    console.error(`POST /api/dashboard error: ${err.message}`);
    return res.status(500).json({ msg: 'Server error saving study planner data' });
  }
});

module.exports = router;
