/**
 * Athletic Competition FlexTime Engine
 * 
 * This submodule is responsible for optimizing schedules based on multiple constraints.
 */

const configuration = require('./configuration');
const baseSchedule = require('./baseSchedule');
const constraints = require('./constraints');
const optimization = require('./optimization');
const analysis = require('./analysis');
const dbAdapter = require('./dbAdapter');
const claudeAdapter = require('./claudeAdapter');
const getMCPAdapter = require('./mcpAdapter');

/**
 * Generate an optimized schedule based on provided constraints
 * @param {Object} params - The scheduling parameters
 * @returns {Object} Optimized schedule
 */
exports.generateSchedule = async (params) => {
  try {
    // Initialize MCP if enabled
    let mcp = null;
    if (params.useMCP) {
      mcp = getMCPAdapter();
      
      // Register job with MCP
      if (mcp) {
        await mcp.registerJob({
          sport: params.sport,
          teams: params.teams,
          format: params.competitionFormat
        });
        
        await mcp.startJob();
      }
    }
    
    try {
      // Step 1: Initial Configuration (25%)
      const config = configuration.createConfig(params);
      if (mcp) await mcp.updateProgress(25, 'configuration');
      
      // Step 2: Base Schedule Creation (40%)
      const initialSchedule = baseSchedule.createBaseSchedule(config);
      if (mcp) await mcp.updateProgress(40, 'baseSchedule');
      
      // Step 3: Apply Constraints (60%)
      const constrainedSchedule = constraints.applyConstraints(initialSchedule, config);
      if (mcp) await mcp.updateProgress(60, 'constraints');
      
      // Get Claude AI optimization suggestions if enabled
      let optimizationParams = { optimizationFactors: config.optimizationFactors };
      if (params.useClaudeAI) {
        try {
          const claudeSuggestions = await claudeAdapter.generateOptimizationParameters(constrainedSchedule, config);
          if (claudeSuggestions.success) {
            optimizationParams = claudeSuggestions.parameters;
          }
        } catch (claudeError) {
          console.error('Error getting Claude AI suggestions:', claudeError);
        }
      }
      
      // Step 4: Multi-Factor Optimization (80%)
      const optimizedSchedule = optimization.optimizeSchedule(constrainedSchedule, {
        ...config,
        optimizationFactors: optimizationParams.optimizationFactors
      });
      if (mcp) await mcp.updateProgress(80, 'optimization');
      
      // Step 5: Final Analysis (90%)
      const finalSchedule = analysis.analyzeSchedule(optimizedSchedule);
      if (mcp) await mcp.updateProgress(90, 'analysis');
      
      // Step 6: Save to Database if requested (100%)
      let dbResult = { success: true };
      if (params.saveToDatabase) {
        dbResult = await dbAdapter.saveSchedule(finalSchedule, params.scheduleName);
      }
      if (mcp) await mcp.updateProgress(100, 'complete');
      
      // Complete MCP job if used
      if (mcp) {
        await mcp.completeJob({
          success: true,
          scheduleId: dbResult.scheduleId,
          metrics: finalSchedule.metrics
        });
      }
      
      return {
        success: true,
        schedule: finalSchedule,
        metrics: finalSchedule.metrics,
        dbResult: dbResult.success ? dbResult : null
      };
    } catch (error) {
      // Report error to MCP if enabled
      if (mcp) {
        await mcp.reportError(error);
      }
      throw error;
    }
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
 * Optimize an existing schedule for specific factors
 * @param {Object} schedule - Existing schedule
 * @param {Object} factors - Optimization factors and weights
 * @returns {Object} Optimized schedule
 */
exports.optimizeExistingSchedule = async (schedule, factors) => {
  try {
    // Initialize MCP if requested
    let mcp = null;
    if (factors.useMCP) {
      mcp = getMCPAdapter();
      
      // Register optimization job
      if (mcp) {
        await mcp.registerJob({
          sport: schedule.sport,
          type: 'optimization',
          name: `Optimize ${schedule.sport} Schedule`
        });
        
        await mcp.startJob();
        await mcp.updateProgress(10, 'starting');
      }
    }
    
    try {
      // Get Claude AI optimization suggestions if enabled
      let optimizationParams = { optimizationFactors: factors };
      if (factors.useClaudeAI) {
        try {
          if (mcp) await mcp.updateProgress(30, 'claude_analysis');
          
          const claudeSuggestions = await claudeAdapter.generateOptimizationParameters(schedule, { 
            optimizationFactors: factors
          });
          
          if (claudeSuggestions.success) {
            optimizationParams = claudeSuggestions.parameters;
          }
        } catch (claudeError) {
          console.error('Error getting Claude AI suggestions:', claudeError);
        }
      }
      
      // Run optimization
      if (mcp) await mcp.updateProgress(50, 'optimization');
      const optimizedSchedule = optimization.optimizeSchedule(schedule, { 
        optimizationFactors: optimizationParams.optimizationFactors
      });
      
      // Analyze results
      if (mcp) await mcp.updateProgress(80, 'analysis');
      const finalSchedule = analysis.analyzeSchedule(optimizedSchedule);
      
      // Save to database if requested
      let dbResult = { success: true };
      if (factors.saveToDatabase) {
        if (mcp) await mcp.updateProgress(90, 'saving');
        dbResult = await dbAdapter.saveSchedule(finalSchedule, factors.scheduleName);
      }
      
      // Complete MCP job if used
      if (mcp) {
        await mcp.updateProgress(100, 'complete');
        await mcp.completeJob({
          success: true,
          scheduleId: dbResult.scheduleId,
          metrics: finalSchedule.metrics
        });
      }
      
      return finalSchedule;
    } catch (error) {
      // Report error to MCP if enabled
      if (mcp) {
        await mcp.reportError(error);
      }
      throw error;
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      details: error.stack
    };
  }
};

/**
 * Save schedule to database
 * @param {Object} schedule - The finalized schedule
 * @param {string} name - Name for the schedule
 * @returns {Promise<Object>} Result of the save operation
 */
exports.saveScheduleToDatabase = async (schedule, name) => {
  return await dbAdapter.saveSchedule(schedule, name);
};

/**
 * Load schedule from database
 * @param {number} scheduleId - ID of the schedule to load
 * @returns {Promise<Object>} The loaded schedule
 */
exports.loadScheduleFromDatabase = async (scheduleId) => {
  return await dbAdapter.loadSchedule(scheduleId);
};

/**
 * Save configuration to database
 * @param {Object} config - Configuration object
 * @param {string} name - Name for the configuration
 * @returns {Promise<Object>} Result of the save operation
 */
exports.saveConfigurationToDatabase = async (config, name) => {
  return await dbAdapter.saveConfiguration(config, name);
};

/**
 * Load configuration from database
 * @param {number} configId - ID of the configuration to load
 * @returns {Promise<Object>} Configuration loaded from database
 */
exports.loadConfigurationFromDatabase = async (configId) => {
  return await dbAdapter.loadConfiguration(configId);
};

/**
 * Get Claude AI analysis of a schedule
 * @param {Object} schedule - Schedule to analyze
 * @returns {Promise<Object>} Claude AI analysis
 */
exports.getClaudeAnalysis = async (schedule) => {
  return await claudeAdapter.analyzeSchedule(schedule, schedule.metrics);
};

/**
 * List all schedules in the database
 * @param {Object} filters - Optional filters
 * @returns {Promise<Object>} List of schedules
 */
exports.listSchedules = async (filters = {}) => {
  return await dbAdapter.listSchedules(filters);
};

/**
 * List all configurations in the database
 * @param {Object} filters - Optional filters
 * @returns {Promise<Object>} List of configurations
 */
exports.listConfigurations = async (filters = {}) => {
  return await dbAdapter.listConfigurations(filters);
}; 