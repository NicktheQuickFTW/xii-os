/**
 * FlexTime Scheduling Engine - Notion Integration Module
 * 
 * Handles integration with Notion databases for schedule management
 */

const winston = require('winston');
const NotionService = require('../../notion-integration/services/notionService');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'flextime-notion-integration' },
  transports: [
    new winston.transports.File({ filename: 'logs/flextime-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/flextime-combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ],
});

// Initialize Notion service
const notionService = new NotionService({
  token: process.env.NOTION_API_KEY
});

/**
 * Save a schedule to a Notion database
 * @param {Object} schedule - The schedule to save
 * @param {string} databaseId - Notion database ID
 * @returns {Promise<Object>} Result of save operation
 */
exports.saveSchedule = async (schedule, databaseId) => {
  logger.info('Saving schedule to Notion database', { databaseId });
  
  try {
    // Validate inputs
    if (!schedule || !databaseId) {
      throw new Error('Schedule and database ID are required');
    }
    
    // Get the database schema
    const schema = await notionService.getDatabaseSchema(databaseId);
    logger.debug('Retrieved database schema', { fields: Object.keys(schema) });
    
    // Save games to Notion
    const results = {
      success: true,
      gamesCreated: 0,
      errors: []
    };
    
    // Create Notion properties for each game
    const gamePromises = [];
    
    schedule.weeks.forEach(week => {
      week.matchups.forEach(matchup => {
        // Format date for Notion
        const matchupDate = matchup.date instanceof Date ? 
          matchup.date.toISOString().split('T')[0] : 
          new Date(matchup.date).toISOString().split('T')[0];
        
        // Create game record
        const gameData = {
          'Home Team': matchup.homeTeam,
          'Away Team': matchup.awayTeam,
          'Date': matchupDate,
          'Week': matchup.week,
          'Sport': schedule.sport,
          'Format': schedule.format,
          'Season': `${new Date(schedule.seasonStart).getFullYear()}-${new Date(schedule.seasonEnd).getFullYear()}`
        };
        
        // Add time if available
        if (matchup.date instanceof Date) {
          gameData['Time'] = `${matchup.date.getHours()}:${matchup.date.getMinutes().toString().padStart(2, '0')}`;
        }
        
        // Convert to Notion format and create
        const notionProperties = notionService.convertToNotionProperties(gameData, schema);
        gamePromises.push(
          notionService.createPage(databaseId, notionProperties)
            .then(() => {
              results.gamesCreated++;
            })
            .catch(error => {
              logger.error('Error creating game in Notion', { error: error.message, game: gameData });
              results.errors.push({
                game: gameData,
                error: error.message
              });
            })
        );
      });
    });
    
    // Wait for all games to be created
    await Promise.all(gamePromises);
    
    // Update results
    results.success = results.errors.length === 0;
    
    logger.info('Schedule saved to Notion', { 
      gamesCreated: results.gamesCreated,
      errors: results.errors.length
    });
    
    return results;
    
  } catch (error) {
    logger.error('Error saving schedule to Notion', { error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Load configuration from a Notion database
 * @param {string} configDatabaseId - Notion database ID
 * @returns {Promise<Object>} Configuration object
 */
exports.loadConfiguration = async (configDatabaseId) => {
  logger.info('Loading configuration from Notion database', { databaseId: configDatabaseId });
  
  try {
    // Get all records from the configuration database
    const records = await notionService.queryDatabase(configDatabaseId);
    
    // Create a lookup map by config type
    const configData = {};
    const standardizedRecords = notionService.mapRecordsToStandardFormat(records);
    
    standardizedRecords.forEach(record => {
      const configType = record.properties['Type'] || 'general';
      
      if (!configData[configType]) {
        configData[configType] = [];
      }
      
      configData[configType].push(record.properties);
    });
    
    // Process different types of configuration
    const config = {
      sport: findSingleValue(configData, 'general', 'Sport'),
      seasonStart: findSingleValue(configData, 'general', 'Season Start'),
      seasonEnd: findSingleValue(configData, 'general', 'Season End'),
      championshipDate: findSingleValue(configData, 'general', 'Championship Date'),
      competitionFormat: findSingleValue(configData, 'general', 'Competition Format'),
      gamesPerTeam: parseInt(findSingleValue(configData, 'general', 'Games Per Team')) || undefined,
      teams: processTeams(configData['teams'] || []),
      affiliates: processTeams(configData['affiliates'] || []),
      protectedRivalries: processRivalries(configData['rivalries'] || []),
      institutionalConstraints: processConstraints(configData['institutional_constraints'] || []),
      venueConflicts: processVenueConflicts(configData['venue_conflicts'] || []),
      existingCommitments: processExistingGames(configData['existing_games'] || []),
      optimizationFactors: processOptimizationFactors(configData['optimization_factors'] || [])
    };
    
    logger.info('Configuration loaded from Notion', { 
      sport: config.sport,
      teamCount: config.teams.length
    });
    
    return config;
    
  } catch (error) {
    logger.error('Error loading configuration from Notion', { error: error.message });
    throw error;
  }
};

/**
 * Find a single value in configuration data
 * @param {Object} configData - Configuration data
 * @param {string} type - Configuration type
 * @param {string} key - Property key
 * @returns {*} Value or undefined
 */
function findSingleValue(configData, type, key) {
  if (!configData[type] || configData[type].length === 0) return undefined;
  
  const item = configData[type].find(item => item[key] !== undefined);
  return item ? item[key] : undefined;
}

/**
 * Process team data from Notion
 * @param {Array} teamRecords - Team records from Notion
 * @returns {Array} Processed team objects
 */
function processTeams(teamRecords) {
  return teamRecords.map(record => {
    const team = {
      id: record['Team ID'] || record['Team Name']?.toLowerCase().replace(/[^a-z0-9]/g, ''),
      name: record['Team Name']
    };
    
    // Add optional fields if present
    if (record['Location']) team.location = record['Location'];
    if (record['Latitude'] && record['Longitude']) {
      team.coordinates = {
        lat: parseFloat(record['Latitude']),
        lng: parseFloat(record['Longitude'])
      };
    }
    if (record['Venue']) team.venue = record['Venue'];
    if (record['Conference']) team.conference = record['Conference'];
    if (record['Division']) team.division = record['Division'];
    
    return team;
  });
}

/**
 * Process rivalry data from Notion
 * @param {Array} rivalryRecords - Rivalry records from Notion
 * @returns {Array} Processed rivalry objects
 */
function processRivalries(rivalryRecords) {
  return rivalryRecords.map(record => {
    return {
      team1: record['Team 1'],
      team2: record['Team 2'],
      name: record['Rivalry Name'],
      priority: parseInt(record['Priority']) || 1
    };
  });
}

/**
 * Process constraint data from Notion
 * @param {Array} constraintRecords - Constraint records from Notion
 * @returns {Array} Processed constraint objects
 */
function processConstraints(constraintRecords) {
  return constraintRecords.map(record => {
    const constraint = {
      teamId: record['Team ID'],
      type: record['Constraint Type'],
      description: record['Description']
    };
    
    // Add type-specific fields
    if (constraint.type === 'no-play-day-of-week') {
      constraint.dayOfWeek = parseInt(record['Day of Week']);
    } else if (constraint.type === 'no-play-date-range') {
      constraint.startDate = record['Start Date'];
      constraint.endDate = record['End Date'];
    }
    
    return constraint;
  });
}

/**
 * Process venue conflict data from Notion
 * @param {Array} venueRecords - Venue conflict records from Notion
 * @returns {Array} Processed venue conflict objects
 */
function processVenueConflicts(venueRecords) {
  return venueRecords.map(record => {
    return {
      venue: record['Venue'],
      startDate: record['Start Date'],
      endDate: record['End Date'],
      reason: record['Reason']
    };
  });
}

/**
 * Process existing game data from Notion
 * @param {Array} gameRecords - Existing game records from Notion
 * @returns {Array} Processed game objects
 */
function processExistingGames(gameRecords) {
  return gameRecords.map(record => {
    return {
      homeTeam: record['Home Team'],
      awayTeam: record['Away Team'],
      date: record['Date'],
      type: record['Game Type'] || 'conference'
    };
  });
}

/**
 * Process optimization factor data from Notion
 * @param {Array} factorRecords - Optimization factor records from Notion
 * @returns {Object} Processed optimization factors
 */
function processOptimizationFactors(factorRecords) {
  const factors = {};
  
  factorRecords.forEach(record => {
    const factorName = record['Factor'];
    const factorWeight = parseFloat(record['Weight']) || 1.0;
    
    if (factorName) {
      // Convert to camelCase
      const camelCase = factorName.toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
      
      factors[camelCase] = factorWeight;
    }
  });
  
  return factors;
} 