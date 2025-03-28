const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');
const winston = require('winston');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'ai-server' },
  transports: [
    new winston.transports.File({ filename: 'logs/ai-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/ai-combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ],
});

// Make sure logs directory exists
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// Initialize Express app
const app = express();

// Apply middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Claude contexts from CSV (mock data for now)
const claudeContexts = [
  { id: 1, title: 'Tennis Rules Analysis', content: 'Deep analysis of tennis tiebreaker rules...', tokens: 15000 },
  { id: 2, title: 'Match Statistics Guide', content: 'How to interpret match statistics...', tokens: 12000 },
];

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ai',
    timestamp: new Date().toISOString(),
    metrics: {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      contexts: claudeContexts.length
    }
  });
});

// Claude API endpoint
app.post('/claude', async (req, res) => {
  const { prompt, contextId, maxTokens } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }
  
  try {
    logger.info(`Claude request with prompt: ${prompt.substring(0, 30)}...`);
    
    // In a real implementation, call the Anthropic API
    // For now, mock a response
    const context = contextId ? claudeContexts.find(c => c.id === parseInt(contextId)) : null;
    
    // Simulated Claude response
    const response = {
      completion: `This is a simulated Claude response for: "${prompt.substring(0, 30)}..."`,
      contextUsed: context ? context.title : 'None',
      tokensUsed: maxTokens || 1000
    };
    
    logger.info('Claude request successful');
    res.json(response);
  } catch (error) {
    logger.error('Claude request failed', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Analysis endpoint
app.post('/analyze', async (req, res) => {
  const { data, type, options } = req.body;
  
  if (!data || !type) {
    return res.status(400).json({ error: 'Data and type are required' });
  }
  
  try {
    logger.info(`Analysis request of type: ${type}`);
    
    // Mock analysis based on type
    let result;
    
    switch (type) {
      case 'sentiment':
        result = { score: 0.8, sentiment: 'positive' };
        break;
      case 'summary':
        result = { summary: 'This is a mock summary of the provided data.' };
        break;
      case 'prediction':
        result = { prediction: 'Team A will win with 75% probability.' };
        break;
      default:
        result = { message: 'Unsupported analysis type' };
    }
    
    logger.info('Analysis completed successfully');
    res.json(result);
  } catch (error) {
    logger.error('Analysis failed', error);
    res.status(500).json({ error: 'Failed to analyze data' });
  }
});

// Deep research endpoint (connects to your Python script)
app.post('/deep-research', async (req, res) => {
  const { query, sources, maxResults } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }
  
  try {
    logger.info(`Deep research request: ${query}`);
    
    // In a production system, you would call the Python script via child_process
    // For now, mock a response
    
    const results = {
      query,
      results: [
        { title: 'Tennis Tiebreaker Rules', source: 'Official Tennis Association', relevance: 0.95 },
        { title: 'History of Tennis Scoring', source: 'Tennis Encyclopedia', relevance: 0.82 },
        { title: 'Recent Rule Changes', source: 'Sports Journal', relevance: 0.78 }
      ],
      processingTime: '1.2s'
    };
    
    logger.info('Deep research completed successfully');
    res.json(results);
  } catch (error) {
    logger.error('Deep research failed', error);
    res.status(500).json({ error: 'Failed to process deep research request' });
  }
});

// Start the server
const PORT = process.env.AI_PORT || 3001;

app.listen(PORT, () => {
  logger.info(`AI service running on port ${PORT}`);
  
  // Register with MCP server
  const mcpHost = process.env.MCP_HOST || 'localhost';
  const mcpPort = process.env.MCP_PORT || 3002;
  
  axios.post(`http://${mcpHost}:${mcpPort}/register`, {
    name: 'ai',
    host: 'localhost',
    port: PORT,
    endpoints: ['/claude', '/analyze', '/deep-research'],
    healthCheck: '/health'
  }).then(() => {
    logger.info('Registered with MCP server');
  }).catch(err => {
    logger.warn('Failed to register with MCP server', err.message);
  });
}); 