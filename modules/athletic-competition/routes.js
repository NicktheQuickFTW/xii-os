/**
 * Athletic Competition Routes
 * 
 * These routes handle athletic competition related API endpoints.
 */

const express = require('express');
const router = express.Router();
const controllers = require('./controllers');

// Schedule generation
router.post('/schedules', controllers.generateSchedule);
router.get('/schedules', controllers.listSchedules);
router.get('/schedules/:scheduleId', controllers.loadScheduleFromDatabase);

// Schedule validation and optimization
router.post('/schedules/validate', controllers.validateSchedule);
router.post('/schedules/optimize', controllers.optimizeSchedule);
router.post('/schedules/analyze', controllers.getClaudeAnalysis);

// Database operations
router.post('/schedules/save', controllers.saveScheduleToDatabase);
router.post('/configurations', controllers.saveConfigurationToDatabase);
router.get('/configurations', controllers.listConfigurations);
router.get('/configurations/:configId', controllers.loadConfigurationFromDatabase);

// Handle scheduling engine requests
router.post('/scheduling-engine/generate', controllers.generateSchedule);
router.post('/scheduling-engine/optimize', controllers.optimizeSchedule);
router.post('/scheduling-engine/validate', controllers.validateSchedule);

// Postseason-related routes
router.get('/postseason', controllers.getPostseasonProjections);
router.post('/postseason/simulate', controllers.simulatePostseason);

// Conflict resolution
router.get('/conflicts', controllers.getConflicts);
router.post('/conflicts/resolve', controllers.resolveConflict);

module.exports = router;
