/**
 * FlexTime Scheduling Engine - COMPASS Integration Module
 * 
 * Integrates the COMPASS evaluation system with schedule optimization
 */

const winston = require('winston');
const compass = require('./compass');
const dbAdapter = require('./dbAdapter');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'flextime-compass-integration' },
  transports: [
    new winston.transports.File({ filename: 'logs/flextime-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/flextime-combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ],
});

/**
 * Evaluate all programs in a conference using COMPASS
 * @param {String} conferenceId - Conference identifier
 * @returns {Object} Conference COMPASS evaluations
 */
exports.evaluateConference = async (conferenceId) => {
  logger.info(`Evaluating conference ${conferenceId} using COMPASS`);
  
  try {
    // Fetch all programs in the conference
    const programs = await dbAdapter.getConferencePrograms(conferenceId);
    
    // Fetch data for each program
    const programsData = await Promise.all(
      programs.map(program => fetchProgramData(program.id))
    );
    
    // Calculate COMPASS scores for each program
    const compassEvaluations = programsData.map(programData => 
      compass.calculateCompassScore(programData)
    );
    
    // Compare programs
    const comparisonResults = compass.comparePrograms(compassEvaluations);
    
    // Return comprehensive results
    return {
      conferenceId,
      evaluationDate: new Date(),
      individualEvaluations: compassEvaluations,
      comparisonResults
    };
  } catch (error) {
    logger.error(`Error evaluating conference: ${error.message}`, { error });
    throw error;
  }
};

/**
 * Fetch all necessary data for a program's COMPASS evaluation
 * @param {String} programId - Program identifier
 * @returns {Object} Comprehensive program data
 */
async function fetchProgramData(programId) {
  logger.info(`Fetching data for program ${programId}`);
  
  try {
    // Fetch program basics
    const programInfo = await dbAdapter.getProgramInfo(programId);
    
    // Fetch performance data
    const performanceData = await fetchPerformanceData(programId);
    
    // Fetch roster data
    const rosterData = await fetchRosterData(programId);
    
    // Fetch infrastructure data
    const infrastructureData = await fetchInfrastructureData(programId);
    
    // Fetch prestige data
    const prestigeData = await fetchPrestigeData(programId);
    
    // Fetch academic data
    const academicData = await fetchAcademicData(programId);
    
    // Compile complete program data
    return {
      id: programId,
      name: programInfo.name,
      conference: programInfo.conference,
      performance: performanceData,
      roster: rosterData,
      infrastructure: infrastructureData,
      prestige: prestigeData,
      academic: academicData
    };
  } catch (error) {
    logger.error(`Error fetching program data: ${error.message}`, { error, programId });
    throw error;
  }
}

/**
 * Fetch performance data for a program
 * @param {String} programId - Program identifier
 * @returns {Object} Performance data
 */
async function fetchPerformanceData(programId) {
  try {
    // Fetch current season analytics
    const currentSeason = await dbAdapter.getCurrentSeasonAnalytics(programId);
    
    // Fetch win-loss records
    const winLoss = await dbAdapter.getWinLossData(programId);
    
    // Fetch scoring metrics
    const scoring = await dbAdapter.getScoringMetrics(programId);
    
    return {
      currentSeason,
      winLoss,
      scoring
    };
  } catch (error) {
    logger.error(`Error fetching performance data: ${error.message}`, { error, programId });
    // Return partial data if available
    return {};
  }
}

/**
 * Fetch roster data for a program
 * @param {String} programId - Program identifier
 * @returns {Object} Roster data
 */
async function fetchRosterData(programId) {
  try {
    // Fetch roster continuity data
    const continuity = await dbAdapter.getRosterContinuityData(programId);
    
    // Fetch talent acquisition data
    const acquisition = await dbAdapter.getTalentAcquisitionData(programId);
    
    // Fetch talent development data
    const development = await dbAdapter.getTalentDevelopmentData(programId);
    
    return {
      continuity,
      acquisition,
      development
    };
  } catch (error) {
    logger.error(`Error fetching roster data: ${error.message}`, { error, programId });
    // Return partial data if available
    return {};
  }
}

/**
 * Fetch infrastructure data for a program
 * @param {String} programId - Program identifier
 * @returns {Object} Infrastructure data
 */
async function fetchInfrastructureData(programId) {
  try {
    // Fetch coaching data
    const coaching = await dbAdapter.getCoachingData(programId);
    
    // Fetch facilities data
    const facilities = await dbAdapter.getFacilitiesData(programId);
    
    // Fetch program support data
    const support = await dbAdapter.getProgramSupportData(programId);
    
    return {
      coaching,
      facilities,
      support
    };
  } catch (error) {
    logger.error(`Error fetching infrastructure data: ${error.message}`, { error, programId });
    // Return partial data if available
    return {};
  }
}

/**
 * Fetch prestige data for a program
 * @param {String} programId - Program identifier
 * @returns {Object} Prestige data
 */
async function fetchPrestigeData(programId) {
  try {
    // Fetch historical performance data
    const historical = await dbAdapter.getHistoricalPerformanceData(programId);
    
    // Fetch brand strength data
    const brand = await dbAdapter.getBrandStrengthData(programId);
    
    // Fetch fan support data
    const fanSupport = await dbAdapter.getFanSupportData(programId);
    
    return {
      historical,
      brand,
      fanSupport
    };
  } catch (error) {
    logger.error(`Error fetching prestige data: ${error.message}`, { error, programId });
    // Return partial data if available
    return {};
  }
}

/**
 * Fetch academic and cultural data for a program
 * @param {String} programId - Program identifier
 * @returns {Object} Academic data
 */
async function fetchAcademicData(programId) {
  try {
    // Fetch academic standing data
    const academic = await dbAdapter.getAcademicStandingData(programId);
    
    // Fetch market factors data
    const market = await dbAdapter.getMarketFactorsData(programId);
    
    // Fetch campus environment data
    const campus = await dbAdapter.getCampusEnvironmentData(programId);
    
    return {
      academic,
      market,
      campus
    };
  } catch (error) {
    logger.error(`Error fetching academic data: ${error.message}`, { error, programId });
    // Return partial data if available
    return {};
  }
}

/**
 * Apply COMPASS insights to schedule optimization
 * @param {Object} scheduleOptions - Schedule optimization options
 * @param {Object} compassEvaluations - COMPASS evaluation results
 * @returns {Object} Enhanced schedule options with COMPASS insights
 */
exports.enhanceScheduleWithCompass = (scheduleOptions, compassEvaluations) => {
  logger.info('Enhancing schedule with COMPASS insights');
  
  try {
    const enhancedOptions = {...scheduleOptions};
    
    // Extract program rankings from COMPASS
    const programRankings = {};
    
    compassEvaluations.individualEvaluations.forEach(evaluation => {
      programRankings[evaluation.programName] = {
        compassScore: evaluation.totalScore,
        strengthAreas: getTopStrengthArea(evaluation.componentBreakdown),
        weaknessAreas: getTopWeaknessArea(evaluation.componentBreakdown),
        overallRank: compassEvaluations.comparisonResults.rankings.find(
          r => r.programName === evaluation.programName
        )?.rank || 0
      };
    });
    
    // Add COMPASS rankings to schedule options
    enhancedOptions.programRankings = programRankings;
    
    // Adjust matchup priorities based on COMPASS insights
    enhancedOptions.matchupPriorities = calculateMatchupPriorities(
      enhancedOptions.matchupPriorities || {},
      programRankings
    );
    
    // Generate optimization constraints based on COMPASS
    enhancedOptions.additionalConstraints = generateCompassConstraints(
      programRankings,
      enhancedOptions.additionalConstraints || []
    );
    
    return enhancedOptions;
  } catch (error) {
    logger.error(`Error enhancing schedule with COMPASS: ${error.message}`, { error });
    // Return original options if enhancement fails
    return scheduleOptions;
  }
};

/**
 * Get the top strength area from a program's evaluation
 * @param {Object} componentBreakdown - COMPASS component breakdown
 * @returns {String} Top strength area
 */
function getTopStrengthArea(componentBreakdown) {
  // Find the component with the highest score
  let topComponent = '';
  let topScore = -1;
  
  Object.entries(componentBreakdown).forEach(([component, data]) => {
    if (data.score > topScore) {
      topScore = data.score;
      topComponent = component;
    }
  });
  
  return topComponent;
}

/**
 * Get the top weakness area from a program's evaluation
 * @param {Object} componentBreakdown - COMPASS component breakdown
 * @returns {String} Top weakness area
 */
function getTopWeaknessArea(componentBreakdown) {
  // Find the component with the lowest score
  let weakestComponent = '';
  let lowestScore = 101; // Higher than any possible score
  
  Object.entries(componentBreakdown).forEach(([component, data]) => {
    if (data.score < lowestScore) {
      lowestScore = data.score;
      weakestComponent = component;
    }
  });
  
  return weakestComponent;
}

/**
 * Calculate matchup priorities based on COMPASS rankings
 * @param {Object} existingPriorities - Existing matchup priorities
 * @param {Object} programRankings - COMPASS program rankings
 * @returns {Object} Updated matchup priorities
 */
function calculateMatchupPriorities(existingPriorities, programRankings) {
  const updatedPriorities = {...existingPriorities};
  
  // Sort programs by COMPASS score
  const sortedPrograms = Object.entries(programRankings)
    .sort((a, b) => b[1].compassScore - a[1].compassScore)
    .map(entry => entry[0]);
  
  // Create matchup tiers
  const elitePrograms = sortedPrograms.slice(0, Math.ceil(sortedPrograms.length * 0.25));
  const midTierPrograms = sortedPrograms.slice(
    Math.ceil(sortedPrograms.length * 0.25),
    Math.ceil(sortedPrograms.length * 0.75)
  );
  const lowerTierPrograms = sortedPrograms.slice(Math.ceil(sortedPrograms.length * 0.75));
  
  // Create priority matchups
  // Elite vs Elite (High priority)
  elitePrograms.forEach(homeTeam => {
    elitePrograms.forEach(awayTeam => {
      if (homeTeam !== awayTeam) {
        const matchupKey = `${homeTeam}_${awayTeam}`;
        updatedPriorities[matchupKey] = Math.max(
          updatedPriorities[matchupKey] || 0,
          0.8 // High priority
        );
      }
    });
  });
  
  // Elite vs Mid-tier (Medium priority)
  elitePrograms.forEach(eliteTeam => {
    midTierPrograms.forEach(midTierTeam => {
      const homeMatchupKey = `${eliteTeam}_${midTierTeam}`;
      const awayMatchupKey = `${midTierTeam}_${eliteTeam}`;
      
      updatedPriorities[homeMatchupKey] = Math.max(
        updatedPriorities[homeMatchupKey] || 0,
        0.6 // Medium-high priority
      );
      
      updatedPriorities[awayMatchupKey] = Math.max(
        updatedPriorities[awayMatchupKey] || 0,
        0.5 // Medium priority
      );
    });
  });
  
  // Lower-tier balancing (ensure they get some good matchups)
  lowerTierPrograms.forEach(lowerTeam => {
    elitePrograms.slice(0, 2).forEach(topTeam => {
      const homeMatchupKey = `${lowerTeam}_${topTeam}`;
      updatedPriorities[homeMatchupKey] = Math.max(
        updatedPriorities[homeMatchupKey] || 0,
        0.7 // Higher priority for lower teams to host top teams
      );
    });
  });
  
  return updatedPriorities;
}

/**
 * Generate additional scheduling constraints based on COMPASS insights
 * @param {Object} programRankings - COMPASS program rankings
 * @param {Array} existingConstraints - Existing scheduling constraints
 * @returns {Array} Enhanced constraints
 */
function generateCompassConstraints(programRankings, existingConstraints) {
  const constraints = [...existingConstraints];
  
  // Sort programs by COMPASS score
  const sortedPrograms = Object.entries(programRankings)
    .sort((a, b) => b[1].compassScore - a[1].compassScore)
    .map(entry => entry[0]);
    
  // Top 25% programs should have more premium TV windows
  const topPrograms = sortedPrograms.slice(0, Math.ceil(sortedPrograms.length * 0.25));
  
  topPrograms.forEach(program => {
    constraints.push({
      type: 'PREMIUM_TV_WINDOWS',
      team: program,
      minCount: 3, // At least 3 premium TV windows
      description: `Ensure ${program} gets at least 3 premium TV windows based on COMPASS ranking`
    });
  });
  
  // Ensure balanced home/away distribution for middle-tier teams
  const midTierPrograms = sortedPrograms.slice(
    Math.ceil(sortedPrograms.length * 0.25),
    Math.ceil(sortedPrograms.length * 0.75)
  );
  
  midTierPrograms.forEach(program => {
    constraints.push({
      type: 'HOME_AWAY_BALANCE',
      team: program,
      maxImbalance: 1, // At most 1 more home than away or vice versa
      description: `Ensure ${program} has balanced home/away schedule based on COMPASS ranking`
    });
  });
  
  // Lower-tier teams should have more favorable travel schedules
  const lowerTierPrograms = sortedPrograms.slice(Math.ceil(sortedPrograms.length * 0.75));
  
  lowerTierPrograms.forEach(program => {
    constraints.push({
      type: 'MAX_CONSECUTIVE_AWAY',
      team: program,
      maxCount: 2, // No more than 2 consecutive away games
      description: `Limit consecutive away games for ${program} based on COMPASS ranking`
    });
  });
  
  return constraints;
}

/**
 * Store COMPASS evaluation results in the database
 * @param {Object} evaluationResults - COMPASS evaluation results
 * @returns {Boolean} Success indicator
 */
exports.storeCompassResults = async (evaluationResults) => {
  logger.info(`Storing COMPASS results for conference ${evaluationResults.conferenceId}`);
  
  try {
    await dbAdapter.storeCompassEvaluation(evaluationResults);
    return true;
  } catch (error) {
    logger.error(`Error storing COMPASS results: ${error.message}`, { error });
    return false;
  }
};

/**
 * Get the latest COMPASS evaluation for a conference
 * @param {String} conferenceId - Conference identifier
 * @returns {Object} COMPASS evaluation results
 */
exports.getLatestCompassEvaluation = async (conferenceId) => {
  logger.info(`Retrieving latest COMPASS evaluation for conference ${conferenceId}`);
  
  try {
    return await dbAdapter.getLatestCompassEvaluation(conferenceId);
  } catch (error) {
    logger.error(`Error retrieving COMPASS evaluation: ${error.message}`, { error });
    return null;
  }
}; 