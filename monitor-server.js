const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const winston = require('winston');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'monitor-server' },
  transports: [
    new winston.transports.File({ filename: 'logs/monitor-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/monitor-combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ],
});

// Make sure logs directory exists
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// Make sure public directory exists
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

// Load MCP configuration
let mcpConfig;
try {
  mcpConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'mcp.json'), 'utf8'));
} catch (error) {
  logger.error('Failed to load MCP configuration', error);
  mcpConfig = {
    mcpServers: { main: { host: 'localhost', port: 3002 } },
    services: {},
    security: { auth: { enabled: false } }
  };
}

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Apply middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(publicDir));

// Authentication middleware
const authMiddleware = (req, res, next) => {
  // Skip auth for public paths
  const publicPaths = ['/login', '/health', '/assets'];
  if (publicPaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
  if (!token) {
    return res.redirect('/login');
  }
  
  const secret = process.env.JWT_SECRET || 'xii-os-secret';
  
  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.redirect('/login');
    }
    req.user = decoded;
    next();
  });
};

// Apply authentication to dashboards
if (mcpConfig.security?.auth?.enabled) {
  app.use('/dashboard', authMiddleware);
  app.use('/api', authMiddleware);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'monitor' });
});

// Dashboard HTML
app.get('/', (req, res) => {
  res.redirect('/dashboard');
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(publicDir, 'dashboard.html'));
});

// Login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(publicDir, 'login.html'));
});

// Login API
app.post('/api/login', async (req, res) => {
  try {
    // Forward the login request to the MCP server
    const mcpServer = mcpConfig.mcpServers?.main || { host: 'localhost', port: 3002 };
    const response = await axios.post(`http://${mcpServer.host}:${mcpServer.port}/login`, req.body);
    
    // Set cookie
    if (response.data.token) {
      res.cookie('token', response.data.token, { 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3600000 // 1 hour
      });
    }
    
    res.json(response.data);
  } catch (error) {
    logger.error('Login error', error.message);
    res.status(error.response?.status || 500).json({ error: 'Authentication failed' });
  }
});

// Logout
app.get('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

// Services API
app.get('/api/services', async (req, res) => {
  try {
    const mcpServer = mcpConfig.mcpServers?.main || { host: 'localhost', port: 3002 };
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
    
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.get(`http://${mcpServer.host}:${mcpServer.port}/services`, { headers });
    
    res.json(response.data);
  } catch (error) {
    logger.error('Error fetching services', error.message);
    res.status(error.response?.status || 500).json({ error: 'Failed to fetch services' });
  }
});

// Metrics API
app.get('/api/metrics', async (req, res) => {
  try {
    const mcpServer = mcpConfig.mcpServers?.main || { host: 'localhost', port: 3002 };
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
    
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.get(`http://${mcpServer.host}:${mcpServer.port}/metrics`, { headers });
    
    res.json(response.data);
  } catch (error) {
    logger.error('Error fetching metrics', error.message);
    res.status(error.response?.status || 500).json({ error: 'Failed to fetch metrics' });
  }
});

// Service restart API
app.post('/api/services/:name/restart', async (req, res) => {
  try {
    const mcpServer = mcpConfig.mcpServers?.main || { host: 'localhost', port: 3002 };
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
    
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.post(
      `http://${mcpServer.host}:${mcpServer.port}/services/${req.params.name}/restart`, 
      {}, 
      { headers }
    );
    
    res.json(response.data);
  } catch (error) {
    logger.error(`Error restarting service ${req.params.name}`, error.message);
    res.status(error.response?.status || 500).json({ error: 'Failed to restart service' });
  }
});

// Get logs API
app.get('/api/logs/:service', (req, res) => {
  const { service } = req.params;
  const { level = 'all', lines = 100 } = req.query;
  
  try {
    const logFile = level === 'error' 
      ? `logs/${service}-error.log` 
      : `logs/${service}-combined.log`;
    
    if (!fs.existsSync(logFile)) {
      return res.status(404).json({ error: 'Log file not found' });
    }
    
    // Read the last N lines of the file
    const data = fs.readFileSync(logFile, 'utf8');
    const allLines = data.split('\n').filter(Boolean);
    const lastLines = allLines.slice(-parseInt(lines));
    
    // Parse the JSON logs
    const logs = lastLines.map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        return { message: line, timestamp: new Date().toISOString() };
      }
    });
    
    res.json({ logs });
  } catch (error) {
    logger.error(`Error fetching logs for ${service}`, error.message);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// WebSocket connection for real-time updates
io.on('connection', (socket) => {
  logger.info('Client connected to monitoring dashboard');
  
  // Poll the MCP server for updates and send to clients
  const updateInterval = setInterval(async () => {
    try {
      const mcpServer = mcpConfig.mcpServers?.main || { host: 'localhost', port: 3002 };
      const healthResponse = await axios.get(`http://${mcpServer.host}:${mcpServer.port}/health`);
      
      socket.emit('health-update', healthResponse.data);
    } catch (error) {
      logger.error('Error polling MCP server', error.message);
    }
  }, 5000);
  
  socket.on('disconnect', () => {
    clearInterval(updateInterval);
    logger.info('Client disconnected from monitoring dashboard');
  });
});

// Create HTML dashboard files
const createDashboardFiles = () => {
  // Create login page
  const loginHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>XII-OS Monitor - Login</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <style>
    body {
      background-color: #f8f9fa;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .login-form {
      width: 100%;
      max-width: 400px;
      padding: 15px;
      margin: auto;
    }
    .logo {
      text-align: center;
      margin-bottom: 20px;
    }
    .form-floating {
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="login-form">
      <div class="logo">
        <h1>XII-OS</h1>
        <h4>Monitoring Dashboard</h4>
      </div>
      <div class="card shadow">
        <div class="card-body">
          <form id="loginForm">
            <div class="form-floating mb-3">
              <input type="text" class="form-control" id="username" placeholder="Username" required>
              <label for="username">Username</label>
            </div>
            <div class="form-floating mb-3">
              <input type="password" class="form-control" id="password" placeholder="Password" required>
              <label for="password">Password</label>
            </div>
            <div class="d-grid">
              <button class="btn btn-primary" type="submit">Log In</button>
            </div>
            <div id="errorMessage" class="alert alert-danger mt-3" style="display: none;"></div>
          </form>
        </div>
      </div>
    </div>
  </div>

  <script>
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const errorMessage = document.getElementById('errorMessage');
      
      errorMessage.style.display = 'none';
      
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok && data.token) {
          // Store token and redirect
          localStorage.setItem('token', data.token);
          window.location.href = '/dashboard';
        } else {
          errorMessage.textContent = data.error || 'Login failed';
          errorMessage.style.display = 'block';
        }
      } catch (error) {
        errorMessage.textContent = 'Unable to connect to server';
        errorMessage.style.display = 'block';
      }
    });
  </script>
</body>
</html>
  `;
  
  // Create dashboard page
  const dashboardHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>XII-OS Monitoring Dashboard</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <style>
    .sidebar {
      height: 100vh;
      position: fixed;
      top: 0;
      left: 0;
      background-color: #212529;
      color: white;
      padding-top: 20px;
    }
    .main-content {
      margin-left: 250px;
      padding: 20px;
    }
    .status-healthy {
      background-color: #d1e7dd;
      color: #0f5132;
    }
    .status-unhealthy {
      background-color: #f8d7da;
      color: #842029;
    }
    .status-unknown {
      background-color: #fff3cd;
      color: #664d03;
    }
    .service-card {
      margin-bottom: 20px;
    }
    .service-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    @media (max-width: 768px) {
      .sidebar {
        width: 100%;
        height: auto;
        position: relative;
      }
      .main-content {
        margin-left: 0;
      }
    }
  </style>
</head>
<body>
  <div class="container-fluid">
    <div class="row">
      <div class="col-md-3 col-lg-2 sidebar">
        <h3 class="text-center">XII-OS</h3>
        <p class="text-center text-muted">Master Control Program</p>
        <div class="d-grid gap-2 p-3">
          <a href="#services" class="btn btn-outline-light">Services</a>
          <a href="#metrics" class="btn btn-outline-light">Metrics</a>
          <a href="#logs" class="btn btn-outline-light">Logs</a>
          <button id="logoutBtn" class="btn btn-danger mt-5">Logout</button>
        </div>
      </div>
      
      <div class="col-md-9 col-lg-10 main-content">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h2>System Overview</h2>
          <span id="lastUpdated" class="text-muted">Last updated: Never</span>
        </div>
        
        <div class="row mb-4">
          <div class="col-md-4">
            <div class="card text-center">
              <div class="card-body">
                <h5 class="card-title">Services</h5>
                <p id="serviceCount" class="card-text display-4">0</p>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card text-center">
              <div class="card-body">
                <h5 class="card-title">Healthy</h5>
                <p id="healthyCount" class="card-text display-4 text-success">0</p>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card text-center">
              <div class="card-body">
                <h5 class="card-title">Issues</h5>
                <p id="issuesCount" class="card-text display-4 text-danger">0</p>
              </div>
            </div>
          </div>
        </div>
        
        <div id="services" class="mb-5">
          <h3>Services</h3>
          <div id="serviceCards" class="row">
            <div class="text-center py-5 text-muted">
              <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <p class="mt-2">Loading services...</p>
            </div>
          </div>
        </div>
        
        <div id="metrics" class="mb-5">
          <h3>System Metrics</h3>
          <div class="card">
            <div class="card-body">
              <p class="text-muted">Coming soon: CPU, Memory, and Request metrics</p>
            </div>
          </div>
        </div>
        
        <div id="logs">
          <h3>Recent Logs</h3>
          <div class="card">
            <div class="card-body">
              <div class="form-group mb-3">
                <select id="logLevel" class="form-select">
                  <option value="all">All Levels</option>
                  <option value="info">Info</option>
                  <option value="warn">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>
              <div id="logEntries" class="border p-2 bg-light" style="max-height: 400px; overflow-y: auto;">
                <p class="text-muted text-center">No logs available</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <script src="/socket.io/socket.io.js"></script>
  <script>
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
    }
    
    // Connect to socket.io
    const socket = io({
      auth: {
        token
      }
    });
    
    // DOM elements
    const serviceCards = document.getElementById('serviceCards');
    const serviceCount = document.getElementById('serviceCount');
    const healthyCount = document.getElementById('healthyCount');
    const issuesCount = document.getElementById('issuesCount');
    const lastUpdated = document.getElementById('lastUpdated');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Logout functionality
    logoutBtn.addEventListener('click', async () => {
      await fetch('/api/logout');
      localStorage.removeItem('token');
      window.location.href = '/login';
    });
    
    // Fetch services data
    async function fetchServices() {
      try {
        const response = await fetch('/api/services', {
          headers: {
            'Authorization': 'Bearer ' + token
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch services');
        }
        
        const data = await response.json();
        updateServiceUI(data.services);
      } catch (error) {
        console.error('Error fetching services:', error);
      }
    }
    
    // Update UI with service data
    function updateServiceUI(services) {
      const serviceKeys = Object.keys(services);
      serviceCount.textContent = serviceKeys.length;
      
      const healthy = serviceKeys.filter(key => services[key].status === 'healthy').length;
      healthyCount.textContent = healthy;
      issuesCount.textContent = serviceKeys.length - healthy;
      
      lastUpdated.textContent = 'Last updated: ' + new Date().toLocaleTimeString();
      
      serviceCards.innerHTML = '';
      
      if (serviceKeys.length === 0) {
        serviceCards.innerHTML = '<div class="col-12 text-center text-muted">No services found</div>';
        return;
      }
      
      serviceKeys.forEach(key => {
        const service = services[key];
        const statusClass = service.status === 'healthy' ? 'status-healthy' : 
                           (service.status === 'unknown' ? 'status-unknown' : 'status-unhealthy');
        
        const card = document.createElement('div');
        card.className = 'col-md-6 col-lg-4 service-card';
        card.innerHTML = \`
          <div class="card">
            <div class="card-header \${statusClass}">
              <div class="service-header">
                <h5 class="mb-0">\${key}</h5>
                <span class="badge bg-light text-dark">\${service.status}</span>
              </div>
            </div>
            <div class="card-body">
              <p><strong>Host:</strong> \${service.host}</p>
              <p><strong>Port:</strong> \${service.port}</p>
              <p><strong>Last Checked:</strong> \${service.lastChecked ? new Date(service.lastChecked).toLocaleString() : 'Never'}</p>
              <div class="d-grid">
                <button class="btn btn-sm btn-outline-primary restart-btn" data-service="\${key}">Restart Service</button>
              </div>
            </div>
          </div>
        \`;
        
        serviceCards.appendChild(card);
      });
      
      // Add restart button handlers
      document.querySelectorAll('.restart-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const serviceName = e.target.dataset.service;
          try {
            btn.disabled = true;
            btn.textContent = 'Restarting...';
            
            const response = await fetch(\`/api/services/\${serviceName}/restart\`, {
              method: 'POST',
              headers: {
                'Authorization': 'Bearer ' + token
              }
            });
            
            if (!response.ok) {
              throw new Error('Failed to restart service');
            }
            
            setTimeout(() => {
              fetchServices();
            }, 2000);
          } catch (error) {
            console.error(\`Error restarting \${serviceName}:\`, error);
            btn.textContent = 'Failed to restart';
            setTimeout(() => {
              btn.disabled = false;
              btn.textContent = 'Restart Service';
            }, 3000);
          }
        });
      });
    }
    
    // Socket.io events
    socket.on('health-update', (data) => {
      if (data && data.services) {
        const services = {};
        data.services.forEach(service => {
          services[service.name] = service;
        });
        updateServiceUI(services);
      }
    });
    
    // Initial fetch
    fetchServices();
    
    // Periodically refresh data
    setInterval(fetchServices, 30000);
  </script>
</body>
</html>
  `;
  
  fs.writeFileSync(path.join(publicDir, 'login.html'), loginHtml);
  fs.writeFileSync(path.join(publicDir, 'dashboard.html'), dashboardHtml);
};

// Create dashboard files on startup
createDashboardFiles();

// Start the monitoring server
const PORT = process.env.MONITOR_PORT || mcpConfig.monitoring?.dashboard?.port || 8081;

server.listen(PORT, () => {
  logger.info(`XII-OS Monitoring Dashboard running on port ${PORT}`);
  
  // Register with MCP server
  const mcpServer = mcpConfig.mcpServers?.main || { host: 'localhost', port: 3002 };
  
  axios.post(`http://${mcpServer.host}:${mcpServer.port}/register`, {
    name: 'monitor',
    host: 'localhost',
    port: PORT,
    healthCheck: '/health'
  }).then(() => {
    logger.info('Registered with MCP server');
  }).catch(err => {
    logger.warn('Failed to register with MCP server', err.message);
  });
}); 