const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');
const winston = require('winston');
const fs = require('fs');
const path = require('path');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'tennis-server' },
  transports: [
    new winston.transports.File({ filename: 'logs/tennis-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/tennis-combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ],
});

// Make sure logs directory exists
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// Sample tennis match data
const matches = [
  { id: 1, team1: 'Texas', team2: 'Oklahoma', score: '4-3', date: '2025-03-20' },
  { id: 2, team1: 'Baylor', team2: 'TCU', score: '5-2', date: '2025-03-21' },
  { id: 3, team1: 'Kansas', team2: 'Kansas State', score: '6-1', date: '2025-03-22' },
];

// Initialize Express app
const app = express();

// Apply middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'tennis',
    timestamp: new Date().toISOString(),
    metrics: {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      matches: matches.length
    }
  });
});

// Tennis API endpoints
app.get('/matches', (req, res) => {
  logger.info('Fetching all matches');
  res.json({ matches });
});

app.get('/matches/:id', (req, res) => {
  const match = matches.find(m => m.id === parseInt(req.params.id));
  if (!match) {
    logger.warn(`Match not found: ${req.params.id}`);
    return res.status(404).json({ error: 'Match not found' });
  }
  logger.info(`Fetching match: ${req.params.id}`);
  res.json({ match });
});

app.post('/matches', (req, res) => {
  const { team1, team2, score, date } = req.body;
  if (!team1 || !team2 || !score) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const newMatch = {
    id: matches.length + 1,
    team1,
    team2,
    score,
    date: date || new Date().toISOString().split('T')[0]
  };
  
  matches.push(newMatch);
  logger.info(`Created new match: ${newMatch.id}`);
  res.status(201).json({ match: newMatch });
});

// Tiebreaker calculation endpoint
app.get('/tiebreaker', (req, res) => {
  // Simple implementation - in reality, would calculate based on match records
  const standings = [
    { team: 'Texas', points: 21 },
    { team: 'Baylor', points: 18 },
    { team: 'Oklahoma', points: 15 },
    { team: 'TCU', points: 12 },
    { team: 'Kansas', points: 9 },
    { team: 'Kansas State', points: 6 },
  ];
  
  logger.info('Calculated tiebreaker standings');
  res.json({ standings });
});

// Stats endpoint
app.get('/stats', (req, res) => {
  // Generate some sample stats
  const stats = {
    totalMatches: matches.length,
    averageScore: '4-2',
    topTeam: 'Texas',
    lastUpdated: new Date().toISOString()
  };
  
  logger.info('Fetched tennis stats');
  res.json({ stats });
});

// Start the server
const PORT = process.env.TENNIS_PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Tennis service running on port ${PORT}`);
  
  // Register with MCP server
  const mcpHost = process.env.MCP_HOST || 'localhost';
  const mcpPort = process.env.MCP_PORT || 3002;
  
  axios.post(`http://${mcpHost}:${mcpPort}/register`, {
    name: 'tennis',
    host: 'localhost',
    port: PORT,
    endpoints: ['/matches', '/tiebreaker', '/stats'],
    healthCheck: '/health'
  }).then(() => {
    logger.info('Registered with MCP server');
  }).catch(err => {
    logger.warn('Failed to register with MCP server', err.message);
  });
}); 