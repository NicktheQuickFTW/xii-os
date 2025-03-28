/**
 * Athletic Competition Scheduling Engine - FlexTime
 * 
 * This submodule is responsible for optimizing schedules based on multiple constraints.
 */

const configuration = require('./configuration');
const baseSchedule = require('./baseSchedule');
const constraints = require('./constraints');
const optimization = require('./optimization');
const analysis = require('./analysis');
const notionIntegration = require('./notionIntegration');

/**
 * Generate an optimized schedule based on provided constraints
 * @param {Object} params - The scheduling parameters
 * @returns {Object} Optimized schedule
 */
exports.generateSchedule = (params) => {
  try {
    // Step 1: Initial Configuration
    const config = configuration.createConfig(params);
    
    // Step 2: Base Schedule Creation
    const initialSchedule = baseSchedule.createBaseSchedule(config);
    
    // Step 3: Apply Constraints
    const constrainedSchedule = constraints.applyConstraints(initialSchedule, config);
    
    // Step 4: Multi-Factor Optimization
    const optimizedSchedule = optimization.optimizeSchedule(constrainedSchedule, config);
    
    // Step 5: Final Analysis
    const finalSchedule = analysis.analyzeSchedule(optimizedSchedule);
    
    return {
      success: true,
      schedule: finalSchedule,
      metrics: finalSchedule.metrics
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      details: error.stack
    };
  }
};

/**
 * Validate a schedule against conference rules and constraints
 * @param {Object} schedule - The schedule to validate
 * @returns {Object} Validation results
 */
exports.validateSchedule = (schedule) => {
  // Check all rules and constraints
  return constraints.validateSchedule(schedule);
};

/**
 * Optimize an existing schedule for specific factors (TV viewership, travel, etc.)
 * @param {Object} schedule - Existing schedule
 * @param {Object} factors - Optimization factors and weights
 * @returns {Object} Optimized schedule
 */
exports.optimizeExistingSchedule = (schedule, factors) => {
  return optimization.optimizeSchedule(schedule, { optimizationFactors: factors });
};

/**
 * Save schedule to Notion database
 * @param {Object} schedule - The finalized schedule
 * @param {string} databaseId - Notion database ID
 * @returns {Promise<Object>} Result of the save operation
 */
exports.saveScheduleToNotion = async (schedule, databaseId) => {
  return await notionIntegration.saveSchedule(schedule, databaseId);
};

/**
 * Load schedule configuration from Notion
 * @param {string} configDatabaseId - Notion database ID containing configurations
 * @returns {Promise<Object>} Configuration loaded from Notion
 */
exports.loadConfigFromNotion = async (configDatabaseId) => {
  return await notionIntegration.loadConfiguration(configDatabaseId);
}; 