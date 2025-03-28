/**
 * FlexTime Scheduling Engine - MCP (Mission Control Panel) Adapter
 * 
 * Handles integration with the Mission Control Panel for monitoring and controlling 
 * the scheduling process
 */

const winston = require('winston');
const io = require('socket.io-client');
const EventEmitter = require('events');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'flextime-mcp-adapter' },
  transports: [
    new winston.transports.File({ filename: 'logs/flextime-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/flextime-combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ],
});

class MCPAdapter extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      mcpUrl: options.mcpUrl || 'http://localhost:3040',
      reconnection: options.reconnection !== false,
      reconnectionAttempts: options.reconnectionAttempts || 5,
      reconnectionDelay: options.reconnectionDelay || 3000,
      autoConnect: options.autoConnect !== false
    };
    
    this.socket = null;
    this.connected = false;
    this.jobId = null;
    this.status = 'disconnected';
    this.jobData = {};
    
    if (this.options.autoConnect) {
      this.connect();
    }
  }
  
  /**
   * Connect to the MCP server
   * @returns {Promise} Connection result
   */
  connect() {
    return new Promise((resolve, reject) => {
      try {
        logger.info('Connecting to MCP server', { url: this.options.mcpUrl });
        
        this.socket = io(this.options.mcpUrl, {
          reconnection: this.options.reconnection,
          reconnectionAttempts: this.options.reconnectionAttempts,
          reconnectionDelay: this.options.reconnectionDelay
        });
        
        // Setup event handlers
        this.socket.on('connect', () => {
          this.connected = true;
          this.status = 'connected';
          logger.info('Connected to MCP server');
          this.emit('connected');
          resolve(true);
        });
        
        this.socket.on('disconnect', () => {
          this.connected = false;
          this.status = 'disconnected';
          logger.info('Disconnected from MCP server');
          this.emit('disconnected');
        });
        
        this.socket.on('error', (error) => {
          logger.error('MCP connection error', { error });
          this.emit('error', error);
          reject(error);
        });
        
        // MCP command handlers
        this.socket.on('command', (command) => {
          logger.info('Received command from MCP', { command });
          this.handleCommand(command);
        });
        
      } catch (error) {
        logger.error('Error connecting to MCP', { error: error.message });
        this.status = 'error';
        this.emit('error', error);
        reject(error);
      }
    });
  }
  
  /**
   * Disconnect from the MCP server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.status = 'disconnected';
    }
  }
  
  /**
   * Handle command from MCP
   * @param {Object} command - Command from MCP
   */
  handleCommand(command) {
    switch (command.type) {
      case 'pause':
        this.status = 'paused';
        this.emit('pause', command);
        break;
        
      case 'resume':
        this.status = 'running';
        this.emit('resume', command);
        break;
        
      case 'abort':
        this.status = 'aborted';
        this.emit('abort', command);
        break;
        
      case 'adjust_parameters':
        this.emit('adjust_parameters', command.parameters);
        break;
        
      default:
        logger.warn('Unknown command from MCP', { command });
    }
  }
  
  /**
   * Register a new scheduling job with MCP
   * @param {Object} jobData - Job data
   * @returns {Promise<Object>} Job registration result
   */
  registerJob(jobData) {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        reject(new Error('Not connected to MCP'));
        return;
      }
      
      logger.info('Registering job with MCP', { jobData });
      
      this.socket.emit('register_job', {
        type: 'scheduling',
        subtype: jobData.sport || 'general',
        name: jobData.name || `${jobData.sport} Schedule Generation`,
        parameters: {
          sport: jobData.sport,
          teams: jobData.teams?.length || 0,
          format: jobData.format
        }
      }, (response) => {
        if (response.success) {
          this.jobId = response.jobId;
          this.status = 'registered';
          this.jobData = jobData;
          
          logger.info('Job registered with MCP', { jobId: this.jobId });
          resolve(response);
        } else {
          logger.error('Failed to register job with MCP', { error: response.error });
          reject(new Error(response.error || 'Failed to register job'));
        }
      });
    });
  }
  
  /**
   * Start a registered job
   * @returns {Promise<Object>} Job start result
   */
  startJob() {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        reject(new Error('Not connected to MCP'));
        return;
      }
      
      if (!this.jobId) {
        reject(new Error('No job registered'));
        return;
      }
      
      logger.info('Starting job', { jobId: this.jobId });
      
      this.socket.emit('start_job', { jobId: this.jobId }, (response) => {
        if (response.success) {
          this.status = 'running';
          logger.info('Job started', { jobId: this.jobId });
          resolve(response);
        } else {
          logger.error('Failed to start job', { jobId: this.jobId, error: response.error });
          reject(new Error(response.error || 'Failed to start job'));
        }
      });
    });
  }
  
  /**
   * Update job progress
   * @param {number} progress - Progress percentage (0-100)
   * @param {string} stage - Current processing stage
   * @param {Object} metrics - Optional metrics
   * @returns {Promise<Object>} Update result
   */
  updateProgress(progress, stage, metrics = {}) {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        reject(new Error('Not connected to MCP'));
        return;
      }
      
      if (!this.jobId) {
        reject(new Error('No job registered'));
        return;
      }
      
      logger.debug('Updating job progress', { jobId: this.jobId, progress, stage });
      
      this.socket.emit('update_progress', {
        jobId: this.jobId,
        progress,
        stage,
        metrics
      }, (response) => {
        if (response.success) {
          resolve(response);
        } else {
          logger.error('Failed to update progress', { error: response.error });
          reject(new Error(response.error || 'Failed to update progress'));
        }
      });
    });
  }
  
  /**
   * Complete a job
   * @param {Object} result - Job result
   * @returns {Promise<Object>} Completion result
   */
  completeJob(result) {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        reject(new Error('Not connected to MCP'));
        return;
      }
      
      if (!this.jobId) {
        reject(new Error('No job registered'));
        return;
      }
      
      logger.info('Completing job', { jobId: this.jobId });
      
      this.socket.emit('complete_job', {
        jobId: this.jobId,
        result: {
          success: result.success,
          scheduleId: result.scheduleId,
          metrics: result.metrics || {},
          summary: result.summary || {}
        }
      }, (response) => {
        if (response.success) {
          this.status = 'completed';
          logger.info('Job completed', { jobId: this.jobId });
          resolve(response);
        } else {
          logger.error('Failed to complete job', { error: response.error });
          reject(new Error(response.error || 'Failed to complete job'));
        }
      });
    });
  }
  
  /**
   * Report an error in the job
   * @param {Error|string} error - Error object or message
   * @returns {Promise<Object>} Error report result
   */
  reportError(error) {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        reject(new Error('Not connected to MCP'));
        return;
      }
      
      if (!this.jobId) {
        reject(new Error('No job registered'));
        return;
      }
      
      const errorMessage = error instanceof Error ? error.message : error.toString();
      const errorStack = error instanceof Error ? error.stack : null;
      
      logger.error('Reporting job error', { jobId: this.jobId, error: errorMessage });
      
      this.socket.emit('job_error', {
        jobId: this.jobId,
        error: errorMessage,
        details: errorStack
      }, (response) => {
        if (response.success) {
          this.status = 'error';
          resolve(response);
        } else {
          logger.error('Failed to report error', { error: response.error });
          reject(new Error(response.error || 'Failed to report error'));
        }
      });
    });
  }
}

// Singleton adapter
let mcpAdapter = null;

/**
 * Get MCP adapter instance
 * @param {Object} options - Configuration options
 * @returns {MCPAdapter} MCP adapter instance
 */
function getMCPAdapter(options = {}) {
  if (!mcpAdapter) {
    mcpAdapter = new MCPAdapter(options);
  }
  return mcpAdapter;
}

module.exports = getMCPAdapter; 