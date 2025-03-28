/**
 * FlexTime Scheduling Engine - COMPASS AI Integration Module
 * 
 * Integrates Claude and OpenAI models with COMPASS evaluation system
 */

const winston = require('winston');
const axios = require('axios');
const claudeAI = require('../../claude-ai');
const fs = require('fs').promises;
const path = require('path');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'compass-ai' },
  transports: [
    new winston.transports.File({ filename: 'logs/compass-ai-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/compass-ai.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ],
});

/**
 * Call OpenAI API
 * @param {Object} options - API options
 * @returns {Promise<Object>} - API response
 */
async function callOpenAI(options) {
  try {
    const { prompt, model = 'gpt-4o', temperature = 0.2, max_tokens = 1500 } = options;
    
    logger.info(`Calling OpenAI API with model ${model}`);
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );
    
    return {
      success: true,
      content: response.data.choices[0].message.content,
      model
    };
  } catch (error) {
    logger.error(`OpenAI API error: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// AI-Enhanced Data Processing Functions

/**
 * Process unstructured data with Claude AI to extract COMPASS metrics
 * @param {string} dataType - Type of data to process
 * @param {string} dataContent - Raw unstructured data 
 * @returns {Promise<Object>} - Structured data for COMPASS
 */
exports.processUnstructuredData = async (dataType, dataContent) => {
  logger.info(`Processing unstructured ${dataType} data with Claude`);
  
  try {
    // Create a prompt specific to the data type
    const prompt = createDataProcessingPrompt(dataType, dataContent);
    
    // Call Claude API
    const response = await claudeAI.getCompletion({
      prompt,
      max_tokens: 2000,
      temperature: 0.1,
      model: "claude-3-opus-20240229"
    });
    
    // Extract and parse structured data
    return parseStructuredData(response, dataType);
  } catch (error) {
    logger.error(`Error processing unstructured data: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Create prompt for processing different types of unstructured data
 * @param {string} dataType - Type of data to process
 * @param {string} content - Raw data content
 * @returns {string} - Prompt for Claude
 */
function createDataProcessingPrompt(dataType, content) {
  const basePrompt = `I need you to extract structured data from the following ${dataType} content for our COMPASS basketball program evaluation system. 
Please analyze this content and extract relevant metrics in JSON format.

${content}

`;

  // Add specific instructions based on data type
  switch (dataType) {
    case 'mediaReport':
      return basePrompt + `
Focus on extracting:
1. Team performance metrics
2. Coach evaluations
3. Player development notes
4. Fan sentiment indicators
5. Media attention metrics

Return a JSON object with these categories populated with metrics and values from 0-100 where appropriate.`;
      
    case 'socialMedia':
      return basePrompt + `
Focus on extracting:
1. Fan engagement metrics
2. Sentiment analysis (positive/negative percentage)
3. Brand strength indicators
4. Player popularity rankings
5. Program reputation signals

Return a structured JSON object with numerical values where possible.`;

    case 'recruitingData':
      return basePrompt + `
Focus on extracting:
1. Recruit quality metrics
2. Recruiting class rankings
3. Transfer portal activity
4. Program attractiveness indicators
5. Competition for recruits

Format everything as a detailed JSON object with numerical values and rankings.`;

    default:
      return basePrompt + `
Extract all relevant metrics and indicators that could be valuable for evaluating a college basketball program.
Return the data as a structured JSON object with appropriate numerical values and categories.`;
  }
}

/**
 * Parse structured data from Claude response
 * @param {string} response - Raw response from Claude
 * @param {string} dataType - Type of data that was processed
 * @returns {Object} - Parsed structured data
 */
function parseStructuredData(response, dataType) {
  try {
    // Extract JSON from response (handles cases where Claude adds extra text)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonString = jsonMatch[0];
      return {
        success: true,
        data: JSON.parse(jsonString),
        dataType
      };
    }
    
    // Fallback if JSON extraction fails
    return {
      success: false,
      error: 'Failed to extract JSON from response',
      rawResponse: response
    };
  } catch (error) {
    logger.error(`Error parsing structured data: ${error.message}`);
    return {
      success: false,
      error: error.message,
      rawResponse: response
    };
  }
}

// Adaptive Weighting Functions

/**
 * Optimize COMPASS component weights based on historical performance data
 * @param {Array} historicalData - Array of historical program data and outcomes
 * @returns {Promise<Object>} - Optimized weights
 */
exports.optimizeComponentWeights = async (historicalData) => {
  logger.info('Optimizing COMPASS component weights');
  
  try {
    // Prepare data for optimization
    const preparedData = prepareDataForOptimization(historicalData);
    
    // Get optimization strategy from OpenAI
    const strategyPrompt = createWeightOptimizationPrompt(preparedData);
    const strategyResponse = await callOpenAI({
      prompt: strategyPrompt,
      model: 'gpt-4o',
      temperature: 0.2
    });
    
    if (!strategyResponse.success) {
      throw new Error('Failed to get optimization strategy');
    }
    
    // Extract recommendation from response
    const recommendedWeights = extractWeightsFromResponse(strategyResponse.content);
    
    // Validate weights (should sum to 1.0)
    const totalWeight = Object.values(recommendedWeights).reduce((sum, w) => sum + w, 0);
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      // Normalize weights if they don't sum to 1.0
      Object.keys(recommendedWeights).forEach(key => {
        recommendedWeights[key] = recommendedWeights[key] / totalWeight;
      });
    }
    
    return {
      success: true,
      weights: recommendedWeights,
      explanation: strategyResponse.content
    };
  } catch (error) {
    logger.error(`Error optimizing weights: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Prepare historical data for weight optimization
 * @param {Array} historicalData - Raw historical data
 * @returns {Object} - Prepared data
 */
function prepareDataForOptimization(historicalData) {
  // Extract relevant metrics and outcomes
  return historicalData.map(record => ({
    programName: record.programName,
    year: record.year,
    // Component scores
    scores: {
      onCourtPerformance: record.componentBreakdown.onCourtPerformance.score,
      rosterDynamics: record.componentBreakdown.rosterDynamics.score,
      programInfrastructure: record.componentBreakdown.programInfrastructure.score,
      programPrestige: record.componentBreakdown.programPrestige.score,
      academicCultural: record.componentBreakdown.academicCultural.score
    },
    // Outcome metrics
    outcomes: {
      winPercentage: record.outcomes.winPercentage,
      tournamentSuccess: record.outcomes.tournamentSuccess,
      recruitingSuccess: record.outcomes.recruitingSuccess,
      fanEngagement: record.outcomes.fanEngagement,
      revenueGeneration: record.outcomes.revenueGeneration
    }
  }));
}

/**
 * Create prompt for weight optimization
 * @param {Object} data - Prepared historical data
 * @returns {string} - Prompt for OpenAI
 */
function createWeightOptimizationPrompt(data) {
  return `I need to optimize the weighting of different components in our COMPASS basketball program evaluation system.
I'll provide historical data showing component scores and program outcomes.
Please analyze this data and recommend optimal component weights that would maximize the predictive power of our overall score.

Current default weights:
- On-Court Performance: 35%
- Roster Dynamics: 25%
- Program Infrastructure: 20%
- Program Prestige: 15%
- Academic & Cultural Factors: 5%

Historical Data:
${JSON.stringify(data, null, 2)}

Based on this data, please:
1. Analyze the correlation between each component and the outcomes
2. Recommend an optimal weight for each component (must sum to 100%)
3. Explain your reasoning for these weight recommendations
4. Suggest if any subcomponents should be weighted differently

Format your response with clear headings and include the recommended weights as a JSON object.`;
}

/**
 * Extract recommended weights from AI response
 * @param {string} response - AI response text
 * @returns {Object} - Extracted weights
 */
function extractWeightsFromResponse(response) {
  try {
    // Try to find JSON in the response
    const jsonMatch = response.match(/\{[\s\S]*?\}/g);
    if (jsonMatch) {
      const jsonString = jsonMatch[0];
      return JSON.parse(jsonString);
    }
    
    // Fallback: extract percentages manually
    const weights = {
      onCourtPerformance: 0.35,
      rosterDynamics: 0.25,
      programInfrastructure: 0.20,
      programPrestige: 0.15,
      academicCultural: 0.05
    };
    
    // Look for percentage patterns for each component
    const onCourtMatch = response.match(/On-Court Performance:?\s*(\d+)%/i);
    if (onCourtMatch) weights.onCourtPerformance = parseInt(onCourtMatch[1]) / 100;
    
    const rosterMatch = response.match(/Roster Dynamics:?\s*(\d+)%/i);
    if (rosterMatch) weights.rosterDynamics = parseInt(rosterMatch[1]) / 100;
    
    const infrastructureMatch = response.match(/Program Infrastructure:?\s*(\d+)%/i);
    if (infrastructureMatch) weights.programInfrastructure = parseInt(infrastructureMatch[1]) / 100;
    
    const prestigeMatch = response.match(/Program Prestige:?\s*(\d+)%/i);
    if (prestigeMatch) weights.programPrestige = parseInt(prestigeMatch[1]) / 100;
    
    const academicMatch = response.match(/Academic (?:&|and) Cultural Factors:?\s*(\d+)%/i);
    if (academicMatch) weights.academicCultural = parseInt(academicMatch[1]) / 100;
    
    return weights;
  } catch (error) {
    logger.error(`Error extracting weights: ${error.message}`);
    // Return default weights if extraction fails
    return {
      onCourtPerformance: 0.35,
      rosterDynamics: 0.25,
      programInfrastructure: 0.20,
      programPrestige: 0.15,
      academicCultural: 0.05
    };
  }
}

// Predictive Analytics Functions

/**
 * Generate predictions for program outcomes using AI models
 * @param {Object} programData - Current program data
 * @param {Object} compassScore - Current COMPASS evaluation
 * @returns {Promise<Object>} - Predicted outcomes
 */
exports.predictProgramOutcomes = async (programData, compassScore) => {
  logger.info(`Predicting outcomes for program: ${programData.name}`);
  
  try {
    // Create prediction prompt
    const prompt = createPredictionPrompt(programData, compassScore);
    
    // Get predictions from Claude (more deterministic model preferred for predictions)
    const response = await claudeAI.getCompletion({
      prompt,
      max_tokens: 2000,
      temperature: 0.1,
      model: "claude-3-opus-20240229"
    });
    
    // Parse predictions
    const predictions = parsePredictions(response);
    
    return {
      success: true,
      predictions,
      programName: programData.name,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error(`Error predicting outcomes: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Create prompt for outcome prediction
 * @param {Object} programData - Program data
 * @param {Object} compassScore - COMPASS evaluation
 * @returns {string} - Prompt for Claude
 */
function createPredictionPrompt(programData, compassScore) {
  return `I need you to predict season outcomes for the following basketball program based on their COMPASS evaluation and current data.

Program Information:
${JSON.stringify(programData, null, 2)}

COMPASS Evaluation:
${JSON.stringify(compassScore, null, 2)}

Please predict the following outcomes for the upcoming season:
1. Overall win-loss record
2. Conference record
3. Postseason prospects (None, NIT, NCAA Tournament with round)
4. Attendance trends
5. Key player development outcomes
6. Media attention level
7. Recruiting impact
8. Revenue projections

For each prediction, include:
- A specific numeric prediction where appropriate
- A confidence level (Low, Medium, High)
- Brief explanation of the prediction

Format your response as a detailed JSON object with these categories clearly defined.`;
}

/**
 * Parse predictions from Claude response
 * @param {string} response - Claude response
 * @returns {Object} - Parsed predictions
 */
function parsePredictions(response) {
  try {
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonString = jsonMatch[0];
      return JSON.parse(jsonString);
    }
    
    // Fallback to structured extraction if JSON parsing fails
    const predictions = {
      record: extractPrediction(response, 'win-loss record', 'record'),
      conferenceRecord: extractPrediction(response, 'conference record', 'conferenceRecord'),
      postseason: extractPrediction(response, 'postseason', 'postseason'),
      attendance: extractPrediction(response, 'attendance', 'attendance'),
      playerDevelopment: extractPrediction(response, 'player development', 'playerDevelopment'),
      mediaAttention: extractPrediction(response, 'media attention', 'mediaAttention'),
      recruiting: extractPrediction(response, 'recruiting', 'recruiting'),
      revenue: extractPrediction(response, 'revenue', 'revenue')
    };
    
    return predictions;
  } catch (error) {
    logger.error(`Error parsing predictions: ${error.message}`);
    return {
      error: 'Failed to parse predictions',
      rawResponse: response
    };
  }
}

/**
 * Extract a specific prediction from text
 * @param {string} text - Full text
 * @param {string} keyword - Keyword to search for
 * @param {string} category - Category name
 * @returns {Object} - Structured prediction
 */
function extractPrediction(text, keyword, category) {
  const pattern = new RegExp(`${keyword}[^\\n]*\\n[^\\n]*`, 'i');
  const match = text.match(pattern);
  
  if (!match) {
    return {
      prediction: 'Not found',
      confidence: 'Low',
      explanation: 'No data found'
    };
  }
  
  // Try to extract confidence level
  const confidenceLevels = ['low', 'medium', 'high'];
  let confidence = 'Medium'; // Default
  
  for (const level of confidenceLevels) {
    if (match[0].toLowerCase().includes(level)) {
      confidence = level.charAt(0).toUpperCase() + level.slice(1);
      break;
    }
  }
  
  return {
    prediction: match[0].split('\n')[0].trim(),
    confidence,
    explanation: match[0].split('\n')[1]?.trim() || 'No explanation provided'
  };
}

// Technology Integration Evaluation

/**
 * Evaluate a program's technology integration level
 * @param {Object} technologyData - Data about program's technology usage
 * @returns {Promise<Object>} - Evaluation results
 */
exports.evaluateTechnologyIntegration = async (technologyData) => {
  logger.info(`Evaluating technology integration for program: ${technologyData.programName}`);
  
  try {
    // Create technology evaluation prompt
    const prompt = createTechnologyEvaluationPrompt(technologyData);
    
    // Get evaluation from OpenAI (better for technical assessments)
    const response = await callOpenAI({
      prompt,
      model: 'gpt-4o',
      temperature: 0.3
    });
    
    if (!response.success) {
      throw new Error('Failed to get technology evaluation');
    }
    
    // Parse evaluation results
    const evaluation = parseTechnologyEvaluation(response.content);
    
    return {
      success: true,
      evaluation,
      programName: technologyData.programName,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error(`Error evaluating technology: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Create prompt for technology evaluation
 * @param {Object} data - Technology data
 * @returns {string} - Prompt for OpenAI
 */
function createTechnologyEvaluationPrompt(data) {
  return `I need you to evaluate the technology integration level of a basketball program for our COMPASS evaluation system.
Below is data about the program's technology usage. Please evaluate their technology integration level on a scale of 0-100,
focusing especially on their use of machine learning, AI, and advanced analytics.

Program Technology Data:
${JSON.stringify(data, null, 2)}

Please evaluate the following aspects:
1. Advanced Analytics Adoption (0-100)
2. Machine Learning / AI Usage (0-100)
3. Performance Technology Integration (0-100)
4. Video/Media Technology Utilization (0-100)
5. Recruitment Technology Implementation (0-100)
6. Overall Technology Score (0-100)

For each aspect, provide:
- A numerical score
- A brief assessment
- Recommendations for improvement

Format your response as a detailed JSON object with these categories.`;
}

/**
 * Parse technology evaluation from OpenAI response
 * @param {string} response - OpenAI response
 * @returns {Object} - Parsed evaluation
 */
function parseTechnologyEvaluation(response) {
  try {
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonString = jsonMatch[0];
      return JSON.parse(jsonString);
    }
    
    // If JSON extraction fails, return a structured error
    return {
      error: 'Failed to parse technology evaluation',
      rawResponse: response
    };
  } catch (error) {
    logger.error(`Error parsing technology evaluation: ${error.message}`);
    return {
      error: error.message,
      rawResponse: response
    };
  }
}

// Continuous Learning Loop

/**
 * Store COMPASS evaluation and actual outcomes for continuous learning
 * @param {Object} compassEvaluation - COMPASS evaluation
 * @param {Object} actualOutcomes - Actual season outcomes
 * @returns {Promise<boolean>} - Success status
 */
exports.storeEvaluationOutcomes = async (compassEvaluation, actualOutcomes) => {
  logger.info(`Storing evaluation and outcomes for program: ${compassEvaluation.programName}`);
  
  try {
    // Create combined record
    const learningRecord = {
      timestamp: new Date().toISOString(),
      programName: compassEvaluation.programName,
      season: actualOutcomes.season,
      compassEvaluation: {
        totalScore: compassEvaluation.totalScore,
        componentBreakdown: compassEvaluation.componentBreakdown
      },
      actualOutcomes: {
        winPercentage: actualOutcomes.winPercentage,
        conferenceRecord: actualOutcomes.conferenceRecord,
        postseasonResult: actualOutcomes.postseasonResult,
        recruitingRanking: actualOutcomes.recruitingRanking,
        attendanceAverage: actualOutcomes.attendanceAverage,
        revenueGenerated: actualOutcomes.revenueGenerated
      }
    };
    
    // Ensure data directory exists
    const dataDir = path.join(__dirname, '../../../data/compass_learning');
    await fs.mkdir(dataDir, { recursive: true });
    
    // Store record
    const filename = `${compassEvaluation.programName.replace(/\s+/g, '_')}_${actualOutcomes.season}.json`;
    await fs.writeFile(
      path.join(dataDir, filename),
      JSON.stringify(learningRecord, null, 2)
    );
    
    logger.info(`Stored learning record for ${compassEvaluation.programName} (${actualOutcomes.season})`);
    return true;
  } catch (error) {
    logger.error(`Error storing evaluation outcomes: ${error.message}`);
    return false;
  }
};

/**
 * Analyze COMPASS prediction accuracy and generate improvement suggestions
 * @param {string} season - Season to analyze
 * @returns {Promise<Object>} - Analysis results
 */
exports.analyzePredictionAccuracy = async (season) => {
  logger.info(`Analyzing COMPASS prediction accuracy for season: ${season}`);
  
  try {
    // Load all learning records for the season
    const learningRecords = await loadLearningRecords(season);
    
    if (learningRecords.length === 0) {
      return {
        success: false,
        error: `No learning records found for season ${season}`
      };
    }
    
    // Create analysis prompt
    const prompt = createAccuracyAnalysisPrompt(learningRecords);
    
    // Get analysis from Claude (better for detailed analysis)
    const response = await claudeAI.getCompletion({
      prompt,
      max_tokens: 3000,
      temperature: 0.2,
      model: "claude-3-opus-20240229"
    });
    
    // Parse analysis results
    const analysis = parseAccuracyAnalysis(response);
    
    return {
      success: true,
      analysis,
      season,
      recordCount: learningRecords.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error(`Error analyzing prediction accuracy: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Load learning records for a specific season
 * @param {string} season - Season to load
 * @returns {Promise<Array>} - Learning records
 */
async function loadLearningRecords(season) {
  try {
    const dataDir = path.join(__dirname, '../../../data/compass_learning');
    const files = await fs.readdir(dataDir);
    
    const seasonFiles = files.filter(file => file.endsWith(`_${season}.json`));
    
    const records = [];
    for (const file of seasonFiles) {
      const content = await fs.readFile(path.join(dataDir, file), 'utf8');
      records.push(JSON.parse(content));
    }
    
    return records;
  } catch (error) {
    logger.error(`Error loading learning records: ${error.message}`);
    return [];
  }
}

/**
 * Create prompt for accuracy analysis
 * @param {Array} records - Learning records
 * @returns {string} - Prompt for Claude
 */
function createAccuracyAnalysisPrompt(records) {
  return `I need you to analyze the accuracy of our COMPASS basketball program evaluation system by comparing predictions with actual outcomes.
Below are records containing both our COMPASS evaluations and the actual outcomes for programs in a given season.

Learning Records:
${JSON.stringify(records, null, 2)}

Please analyze:
1. Overall Prediction Accuracy - How well did COMPASS scores correlate with actual outcomes?
2. Component-Level Analysis - Which components were most/least predictive?
3. Systematic Biases - Did we consistently over/under-predict certain outcomes?
4. Error Patterns - Are there common patterns in prediction errors?
5. Improvement Recommendations - How can we enhance the COMPASS system?

For each area, provide:
- Quantitative analysis where possible
- Qualitative insights
- Specific recommendations

Format your response as a detailed JSON object with these categories, including an "overallAccuracy" score from 0-100.`;
}

/**
 * Parse accuracy analysis from Claude response
 * @param {string} response - Claude response
 * @returns {Object} - Parsed analysis
 */
function parseAccuracyAnalysis(response) {
  try {
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonString = jsonMatch[0];
      return JSON.parse(jsonString);
    }
    
    // If JSON extraction fails, return a structured error
    return {
      error: 'Failed to parse accuracy analysis',
      rawResponse: response
    };
  } catch (error) {
    logger.error(`Error parsing accuracy analysis: ${error.message}`);
    return {
      error: error.message,
      rawResponse: response
    };
  }
}

// Export all functions as a module
module.exports = {
  // Data Processing
  processUnstructuredData: exports.processUnstructuredData,
  
  // Adaptive Weighting
  optimizeComponentWeights: exports.optimizeComponentWeights,
  
  // Predictive Analytics
  predictProgramOutcomes: exports.predictProgramOutcomes,
  
  // Technology Integration
  evaluateTechnologyIntegration: exports.evaluateTechnologyIntegration,
  
  // Continuous Learning
  storeEvaluationOutcomes: exports.storeEvaluationOutcomes,
  analyzePredictionAccuracy: exports.analyzePredictionAccuracy
}; 