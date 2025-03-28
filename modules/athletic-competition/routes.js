/**
 * Athletic Competition Routes
 * 
 * These routes handle athletic competition related API endpoints.
 */

const express = require('express');
const router = express.Router();
const controllers = require('./controllers');

// FlexTime routes
router.post('/flextime', controllers.generateSchedule);
router.get('/flextime', controllers.listSchedules);
router.get('/flextime/:scheduleId', controllers.loadScheduleFromDatabase);

// FlexTime operations
router.post('/flextime/validate', controllers.validateSchedule);
router.post('/flextime/optimize', controllers.optimizeSchedule);
router.post('/flextime/analyze', controllers.getClaudeAnalysis);

// Database operations
router.post('/flextime/save', controllers.saveScheduleToDatabase);
router.post('/configurations', controllers.saveConfigurationToDatabase);
router.get('/configurations', controllers.listConfigurations);
router.get('/configurations/:configId', controllers.loadConfigurationFromDatabase);

// FlexTime engine direct calls
router.post('/flextime-engine/generate', controllers.generateSchedule);
router.post('/flextime-engine/optimize', controllers.optimizeSchedule);
router.post('/flextime-engine/validate', controllers.validateSchedule);

// Postseason-related routes
router.get('/postseason', controllers.getPostseasonProjections);
router.post('/postseason/simulate', controllers.simulatePostseason);

// Conflict resolution
router.get('/conflicts', controllers.getConflicts);
router.post('/conflicts/resolve', controllers.resolveConflict);

module.exports = router;
