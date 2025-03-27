/**
 * Athletic Competition Management Module Routes
 */

const express = require('express');
const router = express.Router();
const controllers = require('./controllers');

// Scheduling endpoints
router.get('/schedule', controllers.getSchedule);
router.post('/schedule', controllers.createSchedule);
router.put('/schedule/:id', controllers.updateSchedule);
router.delete('/schedule/:id', controllers.deleteSchedule);

// Postseason optimization endpoints
router.get('/postseason', controllers.getPostseasonScenarios);
router.post('/postseason/simulate', controllers.simulatePostseason);

// Conflict resolution endpoints
router.get('/conflicts', controllers.getConflicts);
router.post('/conflicts/resolve', controllers.resolveConflict);

module.exports = router;
