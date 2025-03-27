const Anthropic = require('@anthropic-ai/sdk');
const { Pool } = require('pg');

// Initialize database connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'your-api-key', // Replace with actual API key in .env
});

// Ensure context table exists in database
const initializeDatabase = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS claude_contexts (
        id SERIAL PRIMARY KEY,
        context_id TEXT UNIQUE NOT NULL,
        content JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Claude context table initialized');
  } catch (error) {
    console.error('Error initializing Claude context table:', error);
  }
};

initializeDatabase();

// Generate chat completion
const generateChatCompletion = async (req, res) => {
  try {
    const { messages, model = 'claude-3-opus-20240229', max_tokens = 1000, temperature = 0.7, context_id } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }
    
    let contextData = null;
    
    // If context_id is provided, retrieve context
    if (context_id) {
      const contextResult = await pool.query('SELECT content FROM claude_contexts WHERE context_id = $1', [context_id]);
      if (contextResult.rows.length > 0) {
        contextData = contextResult.rows[0].content;
      }
    }
    
    // Add context to system message if available
    const formattedMessages = [...messages];
    if (contextData && contextData.system) {
      // Find the system message and augment it, or add one if not present
      const systemMessageIndex = formattedMessages.findIndex(msg => msg.role === 'system');
      if (systemMessageIndex >= 0) {
        formattedMessages[systemMessageIndex].content = 
          `${contextData.system}\n\n${formattedMessages[systemMessageIndex].content}`;
      } else {
        formattedMessages.unshift({ role: 'system', content: contextData.system });
      }
    }
    
    // Call Anthropic API
    const response = await anthropic.messages.create({
      model,
      max_tokens,
      temperature,
      messages: formattedMessages,
      system: formattedMessages.find(m => m.role === 'system')?.content || undefined
    });
    
    // Update context with new message history if context_id was provided
    if (context_id) {
      // Store the updated messages
      const updatedContext = {
        messages: [...(contextData?.messages || []), ...messages, response.content]
      };
      
      // Merge with existing system content if it exists
      if (contextData?.system) {
        updatedContext.system = contextData.system;
      }
      
      await pool.query(
        'UPDATE claude_contexts SET content = $1, updated_at = CURRENT_TIMESTAMP WHERE context_id = $2',
        [updatedContext, context_id]
      );
    }
    
    res.json(response);
  } catch (error) {
    console.error('Error generating chat completion:', error);
    res.status(500).json({ error: error.message });
  }
};

// Store a new context
const storeContext = async (req, res) => {
  try {
    const { context_id, content } = req.body;
    
    if (!context_id) {
      return res.status(400).json({ error: 'context_id is required' });
    }
    
    if (!content) {
      return res.status(400).json({ error: 'content is required' });
    }
    
    const result = await pool.query(
      'INSERT INTO claude_contexts (context_id, content) VALUES ($1, $2) RETURNING *',
      [context_id, content]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    // Check for duplicate key violation
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Context with this ID already exists' });
    }
    
    console.error('Error storing context:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get context by ID
const getContext = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('SELECT * FROM claude_contexts WHERE context_id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Context not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting context:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update context by ID
const updateContext = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'content is required' });
    }
    
    const result = await pool.query(
      'UPDATE claude_contexts SET content = $1, updated_at = CURRENT_TIMESTAMP WHERE context_id = $2 RETURNING *',
      [content, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Context not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating context:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete context by ID
const deleteContext = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM claude_contexts WHERE context_id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Context not found' });
    }
    
    res.json({ message: 'Context deleted successfully' });
  } catch (error) {
    console.error('Error deleting context:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  generateChatCompletion,
  storeContext,
  getContext,
  updateContext,
  deleteContext
}; 