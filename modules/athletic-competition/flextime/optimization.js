/**
 * FlexTime Scheduling Engine - Optimization Module
 * 
 * Handles multi-factor optimization of schedules using simulated annealing
 */

const winston = require('winston');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'flextime-optimization' },
  transports: [
    new winston.transports.File({ filename: 'logs/flextime-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/flextime-combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ],
});

/**
 * Optimize a schedule using simulated annealing
 * @param {Object} schedule - Schedule to optimize
 * @param {Object} config - Configuration object
 * @returns {Object} Optimized schedule
 */
exports.optimizeSchedule = (schedule, config) => {
  logger.info('Starting schedule optimization', { sport: config.sport });
  
  // Setup optimization parameters
  const iterations = config.simulatedAnnealingIterations || 1000;
  const initialTemperature = 100;
  const coolingRate = 0.95;
  
  // Copy the schedule for optimization
  let currentSchedule = deepCopy(schedule);
  
  // Calculate initial score
  let currentScore = calculateScheduleScore(currentSchedule, config);
  let bestSchedule = deepCopy(currentSchedule);
  let bestScore = currentScore;
  
  // Track metrics for progress monitoring
  const metrics = {
    initialScore: currentScore,
    iterations: [],
    finalScore: 0,
    improvementPercentage: 0
  };
  
  // Run simulated annealing
  let temperature = initialTemperature;
  
  for (let i = 0; i < iterations; i++) {
    // Create a neighbor solution by making a small change
    const neighborSchedule = generateNeighborSchedule(currentSchedule);
    
    // Skip if neighbor is invalid
    if (!neighborSchedule) continue;
    
    // Calculate new score
    const neighborScore = calculateScheduleScore(neighborSchedule, config);
    
    // Decide whether to accept the new solution
    const scoreDelta = neighborScore - currentScore;
    const acceptProbability = scoreDelta > 0 ? 1 : Math.exp(scoreDelta / temperature);
    
    if (Math.random() < acceptProbability) {
      currentSchedule = neighborSchedule;
      currentScore = neighborScore;
      
      // Update best solution if this is better
      if (currentScore > bestScore) {
        bestSchedule = deepCopy(currentSchedule);
        bestScore = currentScore;
      }
    }
    
    // Track metrics every 100 iterations
    if (i % 100 === 0) {
      metrics.iterations.push({
        iteration: i,
        temperature,
        currentScore,
        bestScore
      });
      
      logger.debug(`Iteration ${i}: temperature=${temperature.toFixed(2)}, currentScore=${currentScore.toFixed(2)}, bestScore=${bestScore.toFixed(2)}`);
    }
    
    // Cool temperature
    temperature *= coolingRate;
  }
  
  // Final metrics
  metrics.finalScore = bestScore;
  metrics.improvementPercentage = ((bestScore - metrics.initialScore) / Math.abs(metrics.initialScore)) * 100;
  
  logger.info('Schedule optimization complete', { 
    initialScore: metrics.initialScore.toFixed(2),
    finalScore: metrics.finalScore.toFixed(2),
    improvement: `${metrics.improvementPercentage.toFixed(2)}%`
  });
  
  // Attach metrics to best schedule
  bestSchedule.optimizationMetrics = metrics;
  
  return bestSchedule;
};

/**
 * Deep copy an object
 * @param {Object} obj - Object to copy
 * @returns {Object} Deep copy
 */
function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Calculate a score for a schedule based on multiple factors
 * @param {Object} schedule - Schedule to score
 * @param {Object} config - Configuration object
 * @returns {number} Score (higher is better)
 */
function calculateScheduleScore(schedule, config) {
  // Initialize score components
  const components = {
    travelEfficiency: 0,
    competitiveBalance: 0,
    tvRevenue: 0,
    studentWellbeing: 0
  };
  
  // 1. Travel Efficiency
  components.travelEfficiency = calculateTravelEfficiency(schedule, config);
  
  // 2. Competitive Balance
  components.competitiveBalance = calculateCompetitiveBalance(schedule, config);
  
  // 3. TV Revenue Potential
  components.tvRevenue = calculateTVRevenuePotential(schedule, config);
  
  // 4. Student-Athlete Well-being
  components.studentWellbeing = calculateStudentWellbeing(schedule, config);
  
  // Apply weights from configuration
  const weightedScore = 
    (components.travelEfficiency * (config.optimizationFactors?.travelEfficiency || 1.0)) +
    (components.competitiveBalance * (config.optimizationFactors?.competitiveBalance || 1.0)) +
    (components.tvRevenue * (config.optimizationFactors?.tvRevenue || 1.0)) +
    (components.studentWellbeing * (config.optimizationFactors?.studentWellbeing || 1.0));
  
  return weightedScore;
}

/**
 * Calculate travel efficiency score
 * @param {Object} schedule - Schedule to evaluate
 * @param {Object} config - Configuration object
 * @returns {number} Score (higher is better)
 */
function calculateTravelEfficiency(schedule, config) {
  // Simplified model using estimated travel distances
  // In a real implementation, this would use actual distances and travel logistics
  
  // Team location map for distance calculation
  const teamLocations = {};
  config.teams.forEach(team => {
    if (team.coordinates) {
      teamLocations[team.id] = team.coordinates;
    }
  });
  
  if (Object.keys(teamLocations).length === 0) {
    // If no coordinates, use a simpler model
    return 50; // Default score
  }
  
  // Calculate total travel distance for each team
  const teamTravelDistances = {};
  const teamHomeBase = {};
  
  // Initialize team stats
  config.teams.forEach(team => {
    teamTravelDistances[team.id] = 0;
    teamHomeBase[team.id] = team.coordinates || null;
  });
  
  // Create chronological game list for each team
  const teamGameSequence = {};
  
  config.teams.forEach(team => {
    teamGameSequence[team.id] = [];
  });
  
  // Build game sequence for each team
  schedule.weeks.forEach(week => {
    week.matchups.forEach(matchup => {
      const homeTeamLocation = teamLocations[matchup.homeTeam];
      const awayTeamLocation = teamLocations[matchup.awayTeam];
      
      // Add to away team's sequence (they travel)
      if (homeTeamLocation && awayTeamLocation) {
        teamGameSequence[matchup.awayTeam].push({
          date: matchup.date,
          location: homeTeamLocation,
          opponent: matchup.homeTeam,
          isAway: true
        });
        
        // Add to home team's sequence (no travel)
        teamGameSequence[matchup.homeTeam].push({
          date: matchup.date,
          location: homeTeamLocation,
          opponent: matchup.awayTeam,
          isAway: false
        });
      }
    });
  });
  
  // Sort each team's games chronologically
  Object.keys(teamGameSequence).forEach(teamId => {
    teamGameSequence[teamId].sort((a, b) => a.date - b.date);
  });
  
  // Calculate travel distances for each team's sequence
  Object.entries(teamGameSequence).forEach(([teamId, games]) => {
    if (games.length === 0 || !teamHomeBase[teamId]) return;
    
    let currentLocation = teamHomeBase[teamId];
    
    games.forEach(game => {
      if (game.isAway) {
        // Calculate distance to away game
        const distance = calculateDistance(currentLocation, game.location);
        teamTravelDistances[teamId] += distance;
        
        // Update current location
        currentLocation = game.location;
      } else {
        // For home games, return to home base
        if (JSON.stringify(currentLocation) !== JSON.stringify(teamHomeBase[teamId])) {
          const distance = calculateDistance(currentLocation, teamHomeBase[teamId]);
          teamTravelDistances[teamId] += distance;
          currentLocation = teamHomeBase[teamId];
        }
      }
    });
    
    // Return to home after final game if away
    if (games.length > 0 && games[games.length-1].isAway) {
      const distance = calculateDistance(games[games.length-1].location, teamHomeBase[teamId]);
      teamTravelDistances[teamId] += distance;
    }
  });
  
  // Calculate average travel distance
  let totalDistance = 0;
  let teamCount = 0;
  
  Object.values(teamTravelDistances).forEach(distance => {
    totalDistance += distance;
    teamCount++;
  });
  
  const averageDistance = teamCount > 0 ? totalDistance / teamCount : 0;
  
  // Normalize score (lower distance = higher score)
  // This is simplified; a real implementation would use historical data for normalization
  const normalizedScore = Math.max(100 - (averageDistance / 100), 0);
  
  return normalizedScore;
}

/**
 * Calculate distance between two coordinate points
 * @param {Object} point1 - First point {lat, lng}
 * @param {Object} point2 - Second point {lat, lng}
 * @returns {number} Distance in arbitrary units
 */
function calculateDistance(point1, point2) {
  // Simple Euclidean distance calculation
  // In a real implementation, this would use actual travel distances/times
  const latDiff = point1.lat - point2.lat;
  const lngDiff = point1.lng - point2.lng;
  return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 100; // Scale for more realistic numbers
}

/**
 * Calculate competitive balance score
 * @param {Object} schedule - Schedule to evaluate
 * @param {Object} config - Configuration object
 * @returns {number} Score (higher is better)
 */
function calculateCompetitiveBalance(schedule, config) {
  // Simplified model for competitive balance
  // In a real implementation, this would use strength ratings, NET rankings, etc.
  
  // Without team strength data, we can evaluate distribution equality
  // and protected rivalry inclusion
  let rivalryScore = 0;
  const protectedRivalries = config.protectedRivalries || [];
  
  // Check if protected rivalries are included
  if (protectedRivalries.length > 0) {
    let rivalriesScheduled = 0;
    
    // Check each rivalry
    protectedRivalries.forEach(rivalry => {
      const team1 = rivalry.team1;
      const team2 = rivalry.team2;
      
      // Check if this matchup exists in the schedule
      const matchupExists = schedule.weeks.some(week => 
        week.matchups.some(matchup => 
          (matchup.homeTeam === team1 && matchup.awayTeam === team2) ||
          (matchup.homeTeam === team2 && matchup.awayTeam === team1)
        )
      );
      
      if (matchupExists) {
        rivalriesScheduled++;
      }
    });
    
    // Calculate percentage of rivalries included
    rivalryScore = rivalriesScheduled / protectedRivalries.length * 100;
  } else {
    // If no protected rivalries, give full score
    rivalryScore = 100;
  }
  
  // Without team strength data, return rivalry score
  return rivalryScore;
}

/**
 * Calculate TV revenue potential score
 * @param {Object} schedule - Schedule to evaluate
 * @param {Object} config - Configuration object
 * @returns {number} Score (higher is better)
 */
function calculateTVRevenuePotential(schedule, config) {
  // Simplified model for TV revenue potential
  // In a real implementation, this would use viewership predictions, etc.
  
  // Premium windows by day of week
  const premiumWindows = {
    // Sunday = 0, Monday = 1, etc.
    0: [16, 19], // Sunday 4pm-7pm
    1: [19, 22], // Monday 7pm-10pm
    2: [19, 22], // Tuesday 7pm-10pm
    3: [19, 22], // Wednesday 7pm-10pm
    4: [19, 22], // Thursday 7pm-10pm
    5: [19, 22], // Friday 7pm-10pm
    6: [12, 20]  // Saturday 12pm-8pm
  };
  
  let premiumWindowGames = 0;
  let totalGames = 0;
  
  // Count games in premium windows
  schedule.weeks.forEach(week => {
    week.matchups.forEach(matchup => {
      totalGames++;
      
      const dayOfWeek = matchup.date.getDay();
      const hourOfDay = matchup.date.getHours();
      
      if (premiumWindows[dayOfWeek] && 
          hourOfDay >= premiumWindows[dayOfWeek][0] && 
          hourOfDay <= premiumWindows[dayOfWeek][1]) {
        premiumWindowGames++;
      }
    });
  });
  
  // Calculate percentage in premium windows
  const premiumPercentage = totalGames > 0 ? (premiumWindowGames / totalGames) * 100 : 0;
  
  return premiumPercentage;
}

/**
 * Calculate student-athlete well-being score
 * @param {Object} schedule - Schedule to evaluate
 * @param {Object} config - Configuration object
 * @returns {number} Score (higher is better)
 */
function calculateStudentWellbeing(schedule, config) {
  // Factors affecting student well-being:
  // 1. Minimal weekday travel (prefer Thu-Sun for basketball)
  // 2. Adequate rest between games
  // 3. No excessive consecutive away games
  // 4. Minimal academic calendar conflicts
  
  // Create team game lists
  const teamGames = {};
  
  // Initialize
  config.teams.forEach(team => {
    teamGames[team.id] = [];
  });
  
  // Build game lists
  schedule.weeks.forEach(week => {
    week.matchups.forEach(matchup => {
      // Add to home team's games
      teamGames[matchup.homeTeam].push({
        date: matchup.date,
        isAway: false,
        opponent: matchup.awayTeam
      });
      
      // Add to away team's games
      teamGames[matchup.awayTeam].push({
        date: matchup.date,
        isAway: true,
        opponent: matchup.homeTeam
      });
    });
  });
  
  // Sort each team's games chronologically
  Object.keys(teamGames).forEach(teamId => {
    teamGames[teamId].sort((a, b) => a.date - b.date);
  });
  
  // Calculate scores for each factor
  let weekdayTravelScore = 0;
  let restPeriodScore = 0;
  let consecutiveAwayScore = 0;
  
  // Check each team's schedule
  Object.entries(teamGames).forEach(([teamId, games]) => {
    // Skip if no games
    if (games.length === 0) return;
    
    // 1. Weekday travel score
    let weekdayAwayGames = 0;
    let weekendAwayGames = 0;
    
    games.forEach(game => {
      if (game.isAway) {
        // Check if weekday (Mon-Thu = 1-4)
        const dayOfWeek = game.date.getDay();
        if (dayOfWeek >= 1 && dayOfWeek <= 4) {
          weekdayAwayGames++;
        } else {
          weekendAwayGames++;
        }
      }
    });
    
    const totalAwayGames = weekdayAwayGames + weekendAwayGames;
    if (totalAwayGames > 0) {
      // Higher percentage of weekend away games is better
      const teamWeekdayScore = (weekendAwayGames / totalAwayGames) * 100;
      weekdayTravelScore += teamWeekdayScore;
    }
    
    // 2. Rest period score
    let adequateRestCount = 0;
    
    for (let i = 0; i < games.length - 1; i++) {
      const currentGame = games[i];
      const nextGame = games[i + 1];
      
      // Calculate days between games
      const daysBetween = Math.round((nextGame.date - currentGame.date) / (24 * 60 * 60 * 1000));
      
      // Consider 2+ days between games as adequate rest
      if (daysBetween >= 2) {
        adequateRestCount++;
      }
    }
    
    const restOpportunities = games.length - 1;
    if (restOpportunities > 0) {
      const teamRestScore = (adequateRestCount / restOpportunities) * 100;
      restPeriodScore += teamRestScore;
    }
    
    // 3. Consecutive away game score
    let consecutiveAwayGames = 0;
    let maxConsecutiveAway = 0;
    
    for (let i = 0; i < games.length; i++) {
      if (games[i].isAway) {
        consecutiveAwayGames++;
        maxConsecutiveAway = Math.max(maxConsecutiveAway, consecutiveAwayGames);
      } else {
        consecutiveAwayGames = 0;
      }
    }
    
    // Score based on maximum consecutive away games (fewer is better)
    // 3 or fewer is ideal, more than 5 is problematic
    let teamConsecutiveScore = 100;
    if (maxConsecutiveAway > 3) {
      teamConsecutiveScore = Math.max(100 - ((maxConsecutiveAway - 3) * 20), 0);
    }
    
    consecutiveAwayScore += teamConsecutiveScore;
  });
  
  // Calculate average scores across all teams
  const teamCount = Object.keys(teamGames).length;
  if (teamCount === 0) return 50; // Default score if no teams
  
  weekdayTravelScore /= teamCount;
  restPeriodScore /= teamCount;
  consecutiveAwayScore /= teamCount;
  
  // Combine scores with equal weighting
  const wellbeingScore = (weekdayTravelScore + restPeriodScore + consecutiveAwayScore) / 3;
  
  return wellbeingScore;
}

/**
 * Generate a neighboring schedule by making a small modification
 * @param {Object} schedule - Original schedule
 * @returns {Object} Modified schedule
 */
function generateNeighborSchedule(schedule) {
  // Copy the schedule for modification
  const newSchedule = deepCopy(schedule);
  
  // Choose a random modification approach (different approaches for different sports)
  const modificationApproaches = [
    swapGameDates,
    swapHomeAway,
    moveGameBetweenDays
  ];
  
  const approach = modificationApproaches[Math.floor(Math.random() * modificationApproaches.length)];
  
  // Apply the modification
  return approach(newSchedule);
}

/**
 * Swap dates of two games
 * @param {Object} schedule - Schedule to modify
 * @returns {Object} Modified schedule or null if invalid
 */
function swapGameDates(schedule) {
  // Find weeks with games
  const weeksWithGames = schedule.weeks.filter(week => week.matchups.length > 0);
  if (weeksWithGames.length < 2) return null;
  
  // Select two random weeks
  const week1Index = Math.floor(Math.random() * weeksWithGames.length);
  let week2Index = Math.floor(Math.random() * weeksWithGames.length);
  
  // Ensure different weeks when possible
  if (weeksWithGames.length > 1) {
    while (week2Index === week1Index) {
      week2Index = Math.floor(Math.random() * weeksWithGames.length);
    }
  }
  
  const week1 = weeksWithGames[week1Index];
  const week2 = weeksWithGames[week2Index];
  
  // Select random games from each week
  if (week1.matchups.length === 0 || week2.matchups.length === 0) return null;
  
  const game1Index = Math.floor(Math.random() * week1.matchups.length);
  const game2Index = Math.floor(Math.random() * week2.matchups.length);
  
  const game1 = week1.matchups[game1Index];
  const game2 = week2.matchups[game2Index];
  
  // Check if teams are different to avoid conflicts
  if (game1.homeTeam === game2.homeTeam || 
      game1.homeTeam === game2.awayTeam ||
      game1.awayTeam === game2.homeTeam || 
      game1.awayTeam === game2.awayTeam) {
    return null;
  }
  
  // Swap dates
  const tempDate = game1.date;
  game1.date = game2.date;
  game2.date = tempDate;
  
  // Update week references if needed
  if (week1Index !== week2Index) {
    game1.week = week2.index;
    game2.week = week1.index;
  }
  
  return schedule;
}

/**
 * Swap home/away status for a matchup
 * @param {Object} schedule - Schedule to modify
 * @returns {Object} Modified schedule or null if invalid
 */
function swapHomeAway(schedule) {
  // Only works well for certain sports/formats
  if (schedule.format === 'single-round-robin' || schedule.format === 'double-round-robin') {
    // Find weeks with games
    const allMatchups = schedule.weeks.flatMap(week => week.matchups);
    if (allMatchups.length === 0) return null;
    
    // Select a random matchup
    const matchupIndex = Math.floor(Math.random() * allMatchups.length);
    const matchup = allMatchups[matchupIndex];
    
    // Swap home and away
    const tempHome = matchup.homeTeam;
    matchup.homeTeam = matchup.awayTeam;
    matchup.awayTeam = tempHome;
    
    // Also update teams array to match (if it exists)
    if (matchup.teams && matchup.teams.length === 2) {
      matchup.teams = [matchup.homeTeam, matchup.awayTeam];
    }
    
    return schedule;
  }
  
  return null; // Invalid for this format
}

/**
 * Move a game to a different day within the same week
 * @param {Object} schedule - Schedule to modify
 * @returns {Object} Modified schedule or null if invalid
 */
function moveGameBetweenDays(schedule) {
  // Find weeks with games and multiple days
  const eligibleWeeks = schedule.weeks.filter(week => 
    week.matchups.length > 0 && week.days.length > 1
  );
  
  if (eligibleWeeks.length === 0) return null;
  
  // Select a random week
  const weekIndex = Math.floor(Math.random() * eligibleWeeks.length);
  const week = eligibleWeeks[weekIndex];
  
  // Select a random game from the week
  const gameIndex = Math.floor(Math.random() * week.matchups.length);
  const game = week.matchups[gameIndex];
  
  // Select a new day from the week (different from current)
  const currentDayString = game.date.toDateString();
  const eligibleDays = week.days.filter(day => day.toDateString() !== currentDayString);
  
  if (eligibleDays.length === 0) return null;
  
  const newDayIndex = Math.floor(Math.random() * eligibleDays.length);
  game.date = new Date(eligibleDays[newDayIndex]);
  
  return schedule;
} 