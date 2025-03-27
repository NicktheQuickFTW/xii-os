/**
 * Athletic Competition Management Module
 * 
 * This module exports functionality for managing athletic competitions
 * including scheduling, postseason optimization, and conflict resolution.
 */

const routes = require('./routes');

// Submodule imports
const schedulingEngine = require('./scheduling-engine');
const postseasonOptimization = require('./postseason-optimization');
const conflictResolution = require('./conflict-resolution');

module.exports = {
  routes,
  schedulingEngine,
  postseasonOptimization,
  conflictResolution
};
