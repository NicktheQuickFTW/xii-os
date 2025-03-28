const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const axios = require('axios');
const cron = require('node-cron');
const winston = require('winston');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { promisify } = require('util');
const socketIo = require('socket.io');
const http = require('http');

// Load MCP configuration
const mcpConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'mcp.json'), 'utf8'));

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'mcp-server' },
  transports: [
    new winston.transports.File({ filename: 'logs/mcp-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/mcp-combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ],
});

// Make sure logs directory exists
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Apply security middleware
if (mcpConfig.security && mcpConfig.security.helmet) {
  app.use(helmet());
}

if (mcpConfig.security && mcpConfig.security.cors) {
  app.use(cors());
}

// Apply rate limiting
if (mcpConfig.security && mcpConfig.security.rateLimit) {
  const limiter = rateLimit({
    windowMs: mcpConfig.security.rateLimit.windowMs || 900000,
    max: mcpConfig.security.rateLimit.max || 100
  });
  app.use(limiter);
}

// Configure Express middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Authentication middleware
const authMiddleware = (req, res, next) => {
  if (!mcpConfig.security || !mcpConfig.security.auth || !mcpConfig.security.auth.enabled) {
    return next();
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const secret = process.env.JWT_SECRET || 'xii-os-secret';
  
  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = decoded;
    next();
  });
};

// Service state storage
const serviceState = {};

// Service discovery - initialize with configured services
Object.entries(mcpConfig.services || {}).forEach(([name, config]) => {
  serviceState[name] = {
    ...config,
    status: 'unknown',
    lastChecked: null,
    registered: true,
    metrics: {}
  };
});

// ===== Authentication Routes =====
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  // In a real implementation, check against a database
  // For this example, use hardcoded credentials from config or fallback
  const configUser = mcpConfig.security?.auth?.defaultAdmin?.username || 'admin';
  const configPass = mcpConfig.security?.auth?.defaultAdmin?.password || 'xii-admin';
  
  if (username === configUser && password === configPass) {
    const secret = process.env.JWT_SECRET || 'xii-os-secret';
    const token = jwt.sign({ username }, secret, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// ===== Service Discovery Routes =====
app.post('/register', async (req, res) => {
  const { name, host, port, endpoints, healthCheck } = req.body;
  
  if (!name || !host || !port) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  serviceState[name] = {
    host,
    port,
    endpoints: endpoints || [],
    healthCheck: healthCheck || '/health',
    status: 'registered',
    lastChecked: new Date(),
    registered: true,
    metrics: {}
  };
  
  logger.info(`Service ${name} registered at ${host}:${port}`);
  res.json({ status: 'success', message: `Service ${name} registered` });
});

app.get('/services', authMiddleware, (req, res) => {
  res.json({ services: serviceState });
});

// ===== Health Monitoring Routes =====
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    services: Object.entries(serviceState).map(([name, config]) => ({
      name,
      status: config.status,
      lastChecked: config.lastChecked
    }))
  });
});

app.get('/metrics', authMiddleware, (req, res) => {
  // Return service metrics
  res.json({
    services: Object.entries(serviceState).map(([name, config]) => ({
      name,
      status: config.status,
      lastChecked: config.lastChecked,
      metrics: config.metrics
    }))
  });
});

// ===== Configuration Management Routes =====
app.get('/config', authMiddleware, (req, res) => {
  res.json(mcpConfig);
});

app.post('/config', authMiddleware, (req, res) => {
  // In a real implementation, validate the config
  // For this example, just update the in-memory config
  try {
    const newConfig = req.body;
    // Merge new config with existing
    Object.assign(mcpConfig, newConfig);
    
    // Save to disk
    fs.writeFileSync(path.join(__dirname, 'mcp.json'), JSON.stringify(mcpConfig, null, 2));
    
    logger.info('Configuration updated');
    io.emit('config-updated', { message: 'Configuration updated' });
    
    res.json({ status: 'success', message: 'Configuration updated' });
  } catch (error) {
    logger.error('Error updating configuration', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

// ===== Service Management Routes =====
app.post('/services/:name/restart', authMiddleware, (req, res) => {
  const { name } = req.params;
  
  if (!serviceState[name]) {
    return res.status(404).json({ error: `Service ${name} not found` });
  }
  
  // In a real implementation, restart the service
  logger.info(`Restarting service ${name}`);
  serviceState[name].status = 'restarting';
  
  // Simulate restart
  setTimeout(() => {
    serviceState[name].status = 'running';
    io.emit('service-update', { name, status: 'running' });
  }, 2000);
  
  res.json({ status: 'success', message: `Service ${name} restart initiated` });
});

// ===== Health check cron job =====
cron.schedule('*/1 * * * *', async () => {
  logger.info('Running health checks');
  
  for (const [name, config] of Object.entries(serviceState)) {
    try {
      if (!config.host || !config.port) continue;
      
      const healthUrl = `http://${config.host}:${config.port}${config.healthCheck || '/health'}`;
      const response = await axios.get(healthUrl, { timeout: 5000 });
      
      if (response.status === 200) {
        serviceState[name].status = 'healthy';
        serviceState[name].lastChecked = new Date();
        
        // Update metrics if available
        if (response.data && response.data.metrics) {
          serviceState[name].metrics = response.data.metrics;
        }
      } else {
        serviceState[name].status = 'unhealthy';
        serviceState[name].lastChecked = new Date();
      }
    } catch (error) {
      logger.error(`Health check failed for ${name}`, error.message);
      serviceState[name].status = 'unreachable';
      serviceState[name].lastChecked = new Date();
      
      // Auto-restart if configured
      if (config.autoRestart) {
        logger.info(`Auto-restarting service ${name}`);
        // In a real implementation, restart the service
      }
    }
  }
  
  io.emit('health-update', Object.entries(serviceState).map(([name, config]) => ({
    name,
    status: config.status,
    lastChecked: config.lastChecked
  })));
});

// ===== WebSocket for real-time updates =====
io.on('connection', (socket) => {
  logger.info('Client connected to MCP websocket');
  
  // Send initial state
  socket.emit('init', {
    services: serviceState,
    config: mcpConfig
  });
  
  socket.on('disconnect', () => {
    logger.info('Client disconnected from MCP websocket');
  });
});

// Start the MCP server
const mainServer = Object.values(mcpConfig.mcpServers || {}).find(server => server.default) || mcpConfig.mcpServers?.main;
const PORT = process.env.MCP_PORT || (mainServer?.port || 3002);

server.listen(PORT, () => {
  logger.info(`XII-OS MCP Server running on port ${PORT}`);
  logger.info(`Available services: ${Object.keys(serviceState).join(', ') || 'none'}`);
}); 