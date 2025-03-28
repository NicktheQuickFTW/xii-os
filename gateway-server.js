const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createProxyMiddleware } = require('http-proxy-middleware');
const axios = require('axios');
const winston = require('winston');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'gateway-server' },
  transports: [
    new winston.transports.File({ filename: 'logs/gateway-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/gateway-combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ],
});

// Make sure logs directory exists
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// Load MCP configuration
const mcpConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'mcp.json'), 'utf8'));

// Initialize Express app
const app = express();

// Apply security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Authentication middleware
const authMiddleware = (req, res, next) => {
  // Skip auth for paths that don't require it
  const publicPaths = ['/api/login', '/health'];
  if (publicPaths.some(path => req.path.startsWith(path))) {
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

// Apply authentication to API routes
if (mcpConfig.security?.auth?.enabled) {
  app.use('/api', authMiddleware);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'gateway' });
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    // Forward the login request to the MCP server
    const mcpServer = mcpConfig.mcpServers?.main || { host: 'localhost', port: 3002 };
    const response = await axios.post(`http://${mcpServer.host}:${mcpServer.port}/login`, req.body);
    res.json(response.data);
  } catch (error) {
    logger.error('Login error', error.message);
    res.status(error.response?.status || 500).json({ error: 'Authentication failed' });
  }
});

// Service proxying based on configuration
const setupProxies = () => {
  if (!mcpConfig.gateway?.routes) {
    logger.warn('No API gateway routes configured');
    return;
  }

  mcpConfig.gateway.routes.forEach(route => {
    if (!route.path || !route.service) {
      logger.warn('Invalid route configuration', route);
      return;
    }

    const serviceConfig = mcpConfig.services?.[route.service];
    if (!serviceConfig) {
      logger.warn(`Service ${route.service} not found in configuration`);
      return;
    }

    const target = `http://${serviceConfig.host}:${serviceConfig.port}`;
    const pathRewrite = route.stripPrefix ? { [`^${route.path}`]: '/' } : undefined;

    logger.info(`Setting up proxy: ${route.path} -> ${target}`);
    
    app.use(route.path, createProxyMiddleware({
      target,
      pathRewrite,
      changeOrigin: true,
      logLevel: 'silent',
      onProxyReq: (proxyReq, req, res) => {
        // Add user info if available
        if (req.user) {
          proxyReq.setHeader('X-User', JSON.stringify(req.user));
        }
      },
      onProxyRes: (proxyRes, req, res) => {
        logger.info(`Proxied ${req.method} ${req.path} -> ${proxyRes.statusCode}`);
      },
      onError: (err, req, res) => {
        logger.error(`Proxy error: ${err.message}`);
        res.status(500).json({ error: 'Proxy error', message: err.message });
      }
    }));
  });
};

// Setup proxies on startup
setupProxies();

// Start the gateway server
const PORT = process.env.GATEWAY_PORT || mcpConfig.gateway?.port || 8080;

app.listen(PORT, () => {
  logger.info(`XII-OS API Gateway running on port ${PORT}`);
  
  // Register with MCP server
  const mcpServer = mcpConfig.mcpServers?.main || { host: 'localhost', port: 3002 };
  
  axios.post(`http://${mcpServer.host}:${mcpServer.port}/register`, {
    name: 'gateway',
    host: 'localhost',
    port: PORT,
    healthCheck: '/health'
  }).then(() => {
    logger.info('Registered with MCP server');
  }).catch(err => {
    logger.warn('Failed to register with MCP server', err.message);
  });
}); 