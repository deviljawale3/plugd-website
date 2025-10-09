// Health check endpoint for production monitoring
const express = require('express');
const router = express.Router();

// Basic health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Plugd API is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    domain: process.env.DOMAIN || 'localhost'
  });
});

// Detailed health check with database connection
router.get('/health/detailed', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    
    const healthStatus = {
      success: true,
      message: 'Plugd API detailed health check',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      domain: process.env.DOMAIN || 'localhost',
      services: {
        database: 'unknown',
        memory: {
          used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
          total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
          external: Math.round((process.memoryUsage().external / 1024 / 1024) * 100) / 100
        },
        cpu: process.cpuUsage()
      }
    };

    // Check database connection
    if (mongoose.connection.readyState === 1) {
      healthStatus.services.database = 'connected';
    } else if (mongoose.connection.readyState === 2) {
      healthStatus.services.database = 'connecting';
    } else if (mongoose.connection.readyState === 0) {
      healthStatus.services.database = 'disconnected';
    } else {
      healthStatus.services.database = 'disconnecting';
    }

    // If database is not connected, return warning status
    if (mongoose.connection.readyState !== 1) {
      healthStatus.success = false;
      healthStatus.message = 'API is running but database is not connected';
      return res.status(503).json(healthStatus);
    }

    res.status(200).json(healthStatus);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;