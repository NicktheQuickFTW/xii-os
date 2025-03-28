/**
 * FlexTime Engine - Database Adapter
 * 
 * Handles database integration for schedule management using PostgreSQL
 */

const winston = require('winston');
const knex = require('knex')(require('../../../knexfile').development);

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'flextime-db-adapter' },
  transports: [
    new winston.transports.File({ filename: 'logs/flextime-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/flextime-combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ],
});

/**
 * Save a schedule to the database
 * @param {Object} schedule - The schedule to save
 * @param {string} name - Name for the schedule
 * @returns {Promise<Object>} Result of save operation
 */
exports.saveSchedule = async (schedule, name) => {
  logger.info('Saving schedule to database', { name });
  
  try {
    // Validate inputs
    if (!schedule) {
      throw new Error('Schedule is required');
    }
    
    // Create transaction to ensure all operations succeed or fail together
    const result = await knex.transaction(async (trx) => {
      // 1. Create schedule record
      const [scheduleId] = await trx('flextime_schedules').insert({
        name: name || `${schedule.sport} ${new Date().toISOString().split('T')[0]}`,
        sport: schedule.sport,
        season_start: schedule.seasonStart,
        season_end: schedule.seasonEnd,
        format: schedule.format,
        created_at: new Date(),
        metadata: JSON.stringify({
          metrics: schedule.metrics || {},
          optimizationMetrics: schedule.optimizationMetrics || {}
        })
      }).returning('id');
      
      // 2. Save all matchups
      const matchups = [];
      schedule.weeks.forEach(week => {
        week.matchups.forEach(matchup => {
          matchups.push({
            schedule_id: scheduleId,
            home_team: matchup.homeTeam,
            away_team: matchup.awayTeam,
            week: matchup.week,
            game_date: matchup.date,
            type: matchup.type || 'conference',
            series_id: matchup.seriesId || null,
            series_game: matchup.seriesGame || null,
            created_at: new Date()
          });
        });
      });
      
      if (matchups.length > 0) {
        await trx('flextime_matchups').insert(matchups);
      }
      
      return {
        success: true,
        scheduleId,
        gamesCreated: matchups.length
      };
    });
    
    logger.info('Schedule saved to database', { 
      scheduleId: result.scheduleId,
      gamesCreated: result.gamesCreated
    });
    
    return result;
    
  } catch (error) {
    logger.error('Error saving schedule to database', { error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Load a schedule from the database
 * @param {number} scheduleId - ID of the schedule to load
 * @returns {Promise<Object>} The loaded schedule
 */
exports.loadSchedule = async (scheduleId) => {
  logger.info('Loading schedule from database', { scheduleId });
  
  try {
    // Get schedule record
    const scheduleRecord = await knex('flextime_schedules')
      .where('id', scheduleId)
      .first();
    
    if (!scheduleRecord) {
      throw new Error(`Schedule with ID ${scheduleId} not found`);
    }
    
    // Get all matchups
    const matchupRecords = await knex('flextime_matchups')
      .where('schedule_id', scheduleId)
      .orderBy(['week', 'game_date']);
    
    // Organize matchups by week
    const weeks = [];
    let currentWeek = null;
    let weekMatchups = [];
    
    matchupRecords.forEach(matchup => {
      if (currentWeek !== matchup.week) {
        if (weekMatchups.length > 0) {
          weeks.push({
            index: currentWeek,
            matchups: weekMatchups,
            // Start and end dates would ideally come from the database
            // For now, estimate them based on the game dates
            start: weekMatchups.reduce((earliest, m) => 
              m.game_date < earliest ? m.game_date : earliest, weekMatchups[0].game_date),
            end: weekMatchups.reduce((latest, m) => 
              m.game_date > latest ? m.game_date : latest, weekMatchups[0].game_date)
          });
        }
        currentWeek = matchup.week;
        weekMatchups = [];
      }
      
      weekMatchups.push({
        homeTeam: matchup.home_team,
        awayTeam: matchup.away_team,
        teams: [matchup.home_team, matchup.away_team],
        week: matchup.week,
        date: matchup.game_date,
        type: matchup.type,
        seriesId: matchup.series_id,
        seriesGame: matchup.series_game
      });
    });
    
    // Add the last week
    if (weekMatchups.length > 0) {
      weeks.push({
        index: currentWeek,
        matchups: weekMatchups,
        start: weekMatchups.reduce((earliest, m) => 
          m.game_date < earliest ? m.game_date : earliest, weekMatchups[0].game_date),
        end: weekMatchups.reduce((latest, m) => 
          m.game_date > latest ? m.game_date : latest, weekMatchups[0].game_date)
      });
    }
    
    // Create final schedule object
    const schedule = {
      id: scheduleRecord.id,
      sport: scheduleRecord.sport,
      seasonStart: scheduleRecord.season_start,
      seasonEnd: scheduleRecord.season_end,
      format: scheduleRecord.format,
      weeks: weeks,
      metrics: scheduleRecord.metadata?.metrics || {},
      optimizationMetrics: scheduleRecord.metadata?.optimizationMetrics || {}
    };
    
    logger.info('Schedule loaded from database', { 
      scheduleId,
      weeks: weeks.length,
      matchups: matchupRecords.length
    });
    
    return {
      success: true,
      schedule
    };
    
  } catch (error) {
    logger.error('Error loading schedule from database', { error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Save configuration to the database
 * @param {Object} config - Configuration object
 * @param {string} name - Name for the configuration
 * @returns {Promise<Object>} Result of save operation
 */
exports.saveConfiguration = async (config, name) => {
  logger.info('Saving configuration to database', { name });
  
  try {
    // Validate inputs
    if (!config) {
      throw new Error('Configuration is required');
    }
    
    // Create transaction to ensure all operations succeed or fail together
    const result = await knex.transaction(async (trx) => {
      // 1. Create configuration record
      const [configId] = await trx('flextime_configurations').insert({
        name: name || `${config.sport} Configuration ${new Date().toISOString().split('T')[0]}`,
        sport: config.sport,
        season_start: config.seasonStart,
        season_end: config.seasonEnd,
        championship_date: config.championshipDate,
        competition_format: config.competitionFormat,
        games_per_team: config.gamesPerTeam,
        created_at: new Date(),
        configuration_data: JSON.stringify(config)
      }).returning('id');
      
      // 2. Save team records
      const teams = config.teams.map(team => ({
        config_id: configId,
        team_id: team.id,
        name: team.name,
        location: team.location,
        lat: team.coordinates?.lat,
        lng: team.coordinates?.lng,
        venue: team.venue,
        conference: team.conference,
        division: team.division,
        created_at: new Date()
      }));
      
      if (teams.length > 0) {
        await trx('flextime_teams').insert(teams);
      }
      
      // 3. Save constraints
      if (config.institutionalConstraints && config.institutionalConstraints.length > 0) {
        const constraints = config.institutionalConstraints.map(constraint => ({
          config_id: configId,
          team_id: constraint.teamId,
          type: constraint.type,
          description: constraint.description,
          day_of_week: constraint.dayOfWeek,
          start_date: constraint.startDate,
          end_date: constraint.endDate,
          created_at: new Date()
        }));
        
        await trx('flextime_constraints').insert(constraints);
      }
      
      return {
        success: true,
        configId,
        teamsCreated: teams.length
      };
    });
    
    logger.info('Configuration saved to database', { 
      configId: result.configId,
      teamsCreated: result.teamsCreated
    });
    
    return result;
    
  } catch (error) {
    logger.error('Error saving configuration to database', { error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Load configuration from the database
 * @param {number} configId - ID of the configuration to load
 * @returns {Promise<Object>} The loaded configuration
 */
exports.loadConfiguration = async (configId) => {
  logger.info('Loading configuration from database', { configId });
  
  try {
    // Get configuration record
    const configRecord = await knex('flextime_configurations')
      .where('id', configId)
      .first();
    
    if (!configRecord) {
      throw new Error(`Configuration with ID ${configId} not found`);
    }
    
    // If stored as JSON, use the full configuration 
    if (configRecord.configuration_data) {
      const config = JSON.parse(configRecord.configuration_data);
      
      logger.info('Configuration loaded from database', { configId });
      
      return {
        success: true,
        config
      };
    }
    
    // Otherwise, rebuild configuration from related tables
    // Get teams
    const teamRecords = await knex('flextime_teams')
      .where('config_id', configId);
    
    // Get constraints
    const constraintRecords = await knex('flextime_constraints')
      .where('config_id', configId);
    
    // Convert database records to configuration format
    const teams = teamRecords.map(team => ({
      id: team.team_id,
      name: team.name,
      location: team.location,
      coordinates: team.lat && team.lng ? { lat: team.lat, lng: team.lng } : null,
      venue: team.venue,
      conference: team.conference,
      division: team.division
    }));
    
    const institutionalConstraints = constraintRecords.map(constraint => {
      const baseConstraint = {
        teamId: constraint.team_id,
        type: constraint.type,
        description: constraint.description
      };
      
      if (constraint.type === 'no-play-day-of-week') {
        baseConstraint.dayOfWeek = constraint.day_of_week;
      } else if (constraint.type === 'no-play-date-range') {
        baseConstraint.startDate = constraint.start_date;
        baseConstraint.endDate = constraint.end_date;
      }
      
      return baseConstraint;
    });
    
    // Create config object
    const config = {
      sport: configRecord.sport,
      seasonStart: configRecord.season_start,
      seasonEnd: configRecord.season_end,
      championshipDate: configRecord.championship_date,
      competitionFormat: configRecord.competition_format,
      gamesPerTeam: configRecord.games_per_team,
      teams,
      institutionalConstraints
    };
    
    logger.info('Configuration loaded from database', { 
      configId,
      teams: teams.length,
      constraints: institutionalConstraints.length
    });
    
    return {
      success: true,
      config
    };
    
  } catch (error) {
    logger.error('Error loading configuration from database', { error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * List all schedules in the database
 * @param {Object} filters - Optional filters (sport, season, etc.)
 * @returns {Promise<Object>} List of schedules
 */
exports.listSchedules = async (filters = {}) => {
  logger.info('Listing schedules from database', { filters });
  
  try {
    let query = knex('flextime_schedules').select('*');
    
    // Apply filters
    if (filters.sport) {
      query = query.where('sport', filters.sport);
    }
    
    if (filters.season) {
      query = query.where('season_start', '<=', filters.season)
                   .where('season_end', '>=', filters.season);
    }
    
    // Get results
    const schedules = await query.orderBy('created_at', 'desc');
    
    logger.info('Schedules retrieved from database', { count: schedules.length });
    
    return {
      success: true,
      schedules
    };
    
  } catch (error) {
    logger.error('Error listing schedules from database', { error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * List all configurations in the database
 * @param {Object} filters - Optional filters (sport, etc.)
 * @returns {Promise<Object>} List of configurations
 */
exports.listConfigurations = async (filters = {}) => {
  logger.info('Listing configurations from database', { filters });
  
  try {
    let query = knex('flextime_configurations').select('*');
    
    // Apply filters
    if (filters.sport) {
      query = query.where('sport', filters.sport);
    }
    
    // Get results
    const configurations = await query.orderBy('created_at', 'desc');
    
    logger.info('Configurations retrieved from database', { count: configurations.length });
    
    return {
      success: true,
      configurations
    };
    
  } catch (error) {
    logger.error('Error listing configurations from database', { error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
}; 