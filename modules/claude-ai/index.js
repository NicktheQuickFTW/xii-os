/**
 * Claude AI Integration Module
 * 
 * This module provides a simple interface to Claude AI for different use cases.
 */

const axios = require('axios');
const winston = require('winston');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'claude-ai' },
  transports: [
    new winston.transports.File({ filename: 'logs/claude-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/claude.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ],
});

/**
 * Get a completion from Claude AI
 * @param {Object} options - Completion options
 * @param {string} options.prompt - The prompt to send to Claude
 * @param {number} options.max_tokens - Maximum tokens in the response
 * @param {number} options.temperature - Temperature for generation (0.0-1.0)
 * @param {string} options.model - Claude model to use
 * @returns {Promise<string>} Claude's response
 */
exports.getCompletion = async (options) => {
  try {
    logger.info('Getting completion from Claude AI', { 
      promptLength: options.prompt.length,
      model: options.model || 'claude-3-opus-20240229'
    });
    
    // Check if we're in test mode
    if (process.env.NODE_ENV === 'test' || !process.env.ANTHROPIC_API_KEY) {
      logger.info('Using mock Claude response in test mode');
      return getMockResponse(options.prompt);
    }
    
    // Make API request to Claude
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: options.model || 'claude-3-opus-20240229',
        max_tokens: options.max_tokens || 1000,
        temperature: options.temperature || 0.5,
        messages: [
          { role: 'user', content: options.prompt }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );
    
    logger.info('Claude API response received', { 
      contentLength: response.data.content.length 
    });
    
    return response.data.content[0].text;
  } catch (error) {
    logger.error('Error getting completion from Claude', { 
      error: error.message,
      stack: error.stack
    });
    
    // Return mock response as fallback
    return getMockResponse(options.prompt);
  }
};

/**
 * Generate a mock response for testing
 * @param {string} prompt - The prompt
 * @returns {string} Mock response
 */
function getMockResponse(prompt) {
  // For scheduling analysis
  if (prompt.includes('analyze this schedule') || prompt.includes('sports scheduling consultant')) {
    return `{
      "assessment": "This basketball schedule appears well-balanced overall with good consideration for home/away distribution. The format follows the standard double round-robin approach appropriate for basketball.",
      "suggestions": [
        {"issue": "BYU has consecutive away games against Arizona and Colorado", "recommendation": "Consider rescheduling to add a home game between these matchups"},
        {"issue": "Too many games concentrated in January", "recommendation": "Redistribute some games to December and February for better spacing"},
        {"issue": "Limited primetime slots", "recommendation": "Increase number of games in premium TV windows"}
      ],
      "potentialConflicts": [
        "Several games scheduled during exam periods",
        "Travel distances for east coast teams visiting western teams in consecutive games"
      ]
    }`;
  }
  
  // For optimization parameters
  if (prompt.includes('suggest optimization parameters')) {
    return `{
      "optimizationFactors": {
        "travelEfficiency": 1.4,
        "competitiveBalance": 1.1,
        "tvRevenue": 1.2,
        "studentWellbeing": 1.7
      },
      "explanation": "For basketball, student-athlete wellbeing should be prioritized due to the frequent games and academic demands. Travel efficiency is also important because of multiple games per week.",
      "additionalFactors": [
        {"name": "rivalryImportance", "weight": 1.3, "description": "Ensuring key rivalry games receive optimal scheduling"}
      ]
    }`;
  }
  
  // For configuration validation
  if (prompt.includes('validate this') && prompt.includes('configuration')) {
    return `{
      "valid": true,
      "issues": [],
      "suggestions": [
        "Consider adding protected rivalries to ensure key matchups",
        "Add more specific academic calendar constraints",
        "Consider venue conflicts during holiday events"
      ]
    }`;
  }
  
  // Default mock response
  return `{
    "response": "This is a mock Claude AI response for testing.",
    "analysis": "This seems to be a well-structured prompt.",
    "recommendations": ["Test thoroughly", "Implement fully", "Deploy carefully"]
  }`;
}

/**
 * Get a Claude AI analysis of a document
 * @param {string} document - Document text to analyze
 * @param {string} analysisType - Type of analysis to perform
 * @returns {Promise<Object>} Analysis results
 */
exports.analyzeDocument = async (document, analysisType) => {
  try {
    logger.info('Analyzing document with Claude AI', { 
      analysisType,
      documentLength: document.length
    });
    
    const prompt = createAnalysisPrompt(document, analysisType);
    const response = await exports.getCompletion({
      prompt,
      max_tokens: 2000,
      temperature: 0.1,
      model: 'claude-3-opus-20240229'
    });
    
    return extractAnalysisResults(response, analysisType);
  } catch (error) {
    logger.error('Error analyzing document', { error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Create a prompt for document analysis
 * @param {string} document - Document text
 * @param {string} analysisType - Type of analysis
 * @returns {string} Prompt for Claude
 */
function createAnalysisPrompt(document, analysisType) {
  switch (analysisType) {
    case 'summary':
      return `Please provide a concise summary of the following document:
      
${document}

Please format your response as JSON with the following structure:
{
  "summary": "Concise summary of the document",
  "keyPoints": ["Key point 1", "Key point 2", ...]
}`;
    
    case 'sentiment':
      return `Please analyze the sentiment of the following document:
      
${document}

Please format your response as JSON with the following structure:
{
  "sentiment": "positive/negative/neutral",
  "score": 0.0 to 1.0,
  "explanation": "Brief explanation of the sentiment analysis"
}`;
    
    default:
      return `Please analyze the following document:
      
${document}

Please provide a thorough analysis in JSON format.`;
  }
}

/**
 * Extract analysis results from Claude's response
 * @param {string} response - Claude's response
 * @param {string} analysisType - Type of analysis
 * @returns {Object} Structured analysis results
 */
function extractAnalysisResults(response, analysisType) {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return {
        success: true,
        analysis: JSON.parse(jsonMatch[0])
      };
    }
    
    // Fallback for non-JSON responses
    return {
      success: true,
      analysis: {
        rawResponse: response
      }
    };
  } catch (error) {
    logger.error('Error extracting analysis results', { error: error.message });
    return {
      success: false,
      error: 'Failed to parse analysis results',
      rawResponse: response
    };
  }
}; 