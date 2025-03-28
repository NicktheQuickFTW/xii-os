/**
 * FlexTime Scheduling Engine - Analysis Module
 * 
 * Handles final analysis of optimized schedules
 */

const winston = require('winston');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'flextime-analysis' },
  transports: [
    new winston.transports.File({ filename: 'logs/flextime-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/flextime-combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ],
});

/**
 * Analyze a schedule and generate metrics
 * @param {Object} schedule - Optimized schedule
 * @returns {Object} Schedule with metrics
 */
exports.analyzeSchedule = (schedule) => {
  logger.info('Analyzing schedule');
  
  const analyzedSchedule = {...schedule};
  
  // Generate comprehensive metrics
  const metrics = {
    general: generateGeneralMetrics(schedule),
    teamSpecific: generateTeamMetrics(schedule),
    travel: generateTravelMetrics(schedule),
    balance: generateBalanceMetrics(schedule),
    television: generateTelevisionMetrics(schedule)
  };
  
  // Generate team-by-team schedules
  const teamSchedules = generateTeamSchedules(schedule);
  
  // Add metrics and team schedules to the result
  analyzedSchedule.metrics = metrics;
  analyzedSchedule.teamSchedules = teamSchedules;
  
  logger.info('Schedule analysis complete');
  
  return analyzedSchedule;
};

/**
 * Generate general schedule metrics
 * @param {Object} schedule - Schedule to analyze
 * @returns {Object} General metrics
 */
function generateGeneralMetrics(schedule) {
  const metrics = {
    totalGames: 0,
    gamesPerWeek: [],
    averageGamesPerWeek: 0,
    dayOfWeekDistribution: {
      0: 0, // Sunday
      1: 0, // Monday
      2: 0, // Tuesday
      3: 0, // Wednesday
      4: 0, // Thursday
      5: 0, // Friday
      6: 0  // Saturday
    }
  };
  
  // Count games per week and total
  schedule.weeks.forEach(week => {
    const weekGames = week.matchups.length;
    metrics.totalGames += weekGames;
    metrics.gamesPerWeek.push(weekGames);
    
    // Count games by day of week
    week.matchups.forEach(matchup => {
      const dayOfWeek = matchup.date.getDay();
      metrics.dayOfWeekDistribution[dayOfWeek]++;
    });
  });
  
  // Calculate average games per week
  metrics.averageGamesPerWeek = metrics.totalGames / schedule.weeks.length;
  
  return metrics;
}

/**
 * Generate team-specific metrics
 * @param {Object} schedule - Schedule to analyze
 * @returns {Object} Team metrics
 */
function generateTeamMetrics(schedule) {
  const teamStats = {};
  
  // Initialize team stats
  schedule.weeks.forEach(week => {
    week.matchups.forEach(matchup => {
      // Initialize home team stats
      if (!teamStats[matchup.homeTeam]) {
        teamStats[matchup.homeTeam] = {
          homeGames: 0,
          awayGames: 0,
          totalGames: 0,
          weekdayGames: 0,
          weekendGames: 0,
          dayOfWeekDistribution: {
            0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0
          },
          opponentFrequency: {}
        };
      }
      
      // Initialize away team stats
      if (!teamStats[matchup.awayTeam]) {
        teamStats[matchup.awayTeam] = {
          homeGames: 0,
          awayGames: 0,
          totalGames: 0,
          weekdayGames: 0,
          weekendGames: 0,
          dayOfWeekDistribution: {
            0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0
          },
          opponentFrequency: {}
        };
      }
      
      // Update stats for both teams
      const dayOfWeek = matchup.date.getDay();
      const isWeekend = (dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6);
      
      // Home team stats
      teamStats[matchup.homeTeam].homeGames++;
      teamStats[matchup.homeTeam].totalGames++;
      teamStats[matchup.homeTeam].dayOfWeekDistribution[dayOfWeek]++;
      
      if (isWeekend) {
        teamStats[matchup.homeTeam].weekendGames++;
      } else {
        teamStats[matchup.homeTeam].weekdayGames++;
      }
      
      if (!teamStats[matchup.homeTeam].opponentFrequency[matchup.awayTeam]) {
        teamStats[matchup.homeTeam].opponentFrequency[matchup.awayTeam] = 0;
      }
      teamStats[matchup.homeTeam].opponentFrequency[matchup.awayTeam]++;
      
      // Away team stats
      teamStats[matchup.awayTeam].awayGames++;
      teamStats[matchup.awayTeam].totalGames++;
      teamStats[matchup.awayTeam].dayOfWeekDistribution[dayOfWeek]++;
      
      if (isWeekend) {
        teamStats[matchup.awayTeam].weekendGames++;
      } else {
        teamStats[matchup.awayTeam].weekdayGames++;
      }
      
      if (!teamStats[matchup.awayTeam].opponentFrequency[matchup.homeTeam]) {
        teamStats[matchup.awayTeam].opponentFrequency[matchup.homeTeam] = 0;
      }
      teamStats[matchup.awayTeam].opponentFrequency[matchup.homeTeam]++;
    });
  });
  
  // Calculate derived metrics for each team
  Object.keys(teamStats).forEach(teamId => {
    const stats = teamStats[teamId];
    
    // Home/away balance
    stats.homeAwayRatio = stats.totalGames > 0 ? stats.homeGames / stats.totalGames : 0;
    
    // Weekend percentage
    stats.weekendPercentage = stats.totalGames > 0 ? (stats.weekendGames / stats.totalGames) * 100 : 0;
  });
  
  return teamStats;
}

/**
 * Generate travel-related metrics
 * @param {Object} schedule - Schedule to analyze
 * @returns {Object} Travel metrics
 */
function generateTravelMetrics(schedule) {
  // This would use team location data to calculate actual travel distances
  // For now, we'll track consecutive away games as a simple proxy
  
  const metrics = {
    consecutiveAwayGames: {},
    backToBackGames: {}
  };
  
  // Create team game lists
  const teamGames = {};
  
  // Build game lists
  schedule.weeks.forEach(week => {
    week.matchups.forEach(matchup => {
      // Add to home team's games
      if (!teamGames[matchup.homeTeam]) {
        teamGames[matchup.homeTeam] = [];
      }
      teamGames[matchup.homeTeam].push({
        date: matchup.date,
        isAway: false,
        opponent: matchup.awayTeam
      });
      
      // Add to away team's games
      if (!teamGames[matchup.awayTeam]) {
        teamGames[matchup.awayTeam] = [];
      }
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
  
  // Find consecutive away games
  Object.entries(teamGames).forEach(([teamId, games]) => {
    let maxConsecutiveAway = 0;
    let currentConsecutiveAway = 0;
    
    games.forEach(game => {
      if (game.isAway) {
        currentConsecutiveAway++;
        maxConsecutiveAway = Math.max(maxConsecutiveAway, currentConsecutiveAway);
      } else {
        currentConsecutiveAway = 0;
      }
    });
    
    metrics.consecutiveAwayGames[teamId] = maxConsecutiveAway;
    
    // Find back-to-back games (games on consecutive days)
    let backToBackCount = 0;
    
    for (let i = 0; i < games.length - 1; i++) {
      const currentGame = games[i];
      const nextGame = games[i + 1];
      
      // Calculate days between games
      const daysBetween = Math.round((nextGame.date - currentGame.date) / (24 * 60 * 60 * 1000));
      
      if (daysBetween <= 1) {
        backToBackCount++;
      }
    }
    
    metrics.backToBackGames[teamId] = backToBackCount;
  });
  
  return metrics;
}

/**
 * Generate competitive balance metrics
 * @param {Object} schedule - Schedule to analyze
 * @returns {Object} Balance metrics
 */
function generateBalanceMetrics(schedule) {
  // In a real-world implementation, this would incorporate team strength ratings
  // We'll use home/away balance and schedule distribution as proxies
  
  const metrics = {
    homeAwayBalance: {},
    weekdayWeekendBalance: {},
  };
  
  // Calculate home/away balance for each team
  const teamGames = {};
  
  // Initialize team game counters
  schedule.weeks.forEach(week => {
    week.matchups.forEach(matchup => {
      // Initialize for home team
      if (!teamGames[matchup.homeTeam]) {
        teamGames[matchup.homeTeam] = { home: 0, away: 0, weekday: 0, weekend: 0 };
      }
      
      // Initialize for away team
      if (!teamGames[matchup.awayTeam]) {
        teamGames[matchup.awayTeam] = { home: 0, away: 0, weekday: 0, weekend: 0 };
      }
      
      // Track home/away
      teamGames[matchup.homeTeam].home++;
      teamGames[matchup.awayTeam].away++;
      
      // Track weekday/weekend
      const dayOfWeek = matchup.date.getDay();
      const isWeekend = (dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6);
      
      if (isWeekend) {
        teamGames[matchup.homeTeam].weekend++;
        teamGames[matchup.awayTeam].weekend++;
      } else {
        teamGames[matchup.homeTeam].weekday++;
        teamGames[matchup.awayTeam].weekday++;
      }
    });
  });
  
  // Calculate balance metrics
  Object.entries(teamGames).forEach(([teamId, stats]) => {
    // Home/away balance (0 = perfectly balanced)
    const totalGames = stats.home + stats.away;
    metrics.homeAwayBalance[teamId] = totalGames > 0 ? 
      ((stats.home - stats.away) / totalGames) : 0;
    
    // Weekday/weekend balance (higher = more weekend games)
    metrics.weekdayWeekendBalance[teamId] = totalGames > 0 ? 
      (stats.weekend / totalGames) : 0;
  });
  
  return metrics;
}

/**
 * Generate television-related metrics
 * @param {Object} schedule - Schedule to analyze
 * @returns {Object} TV metrics
 */
function generateTelevisionMetrics(schedule) {
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
  
  const metrics = {
    gamesInPremiumWindows: 0,
    totalGames: 0,
    premiumWindowPercentage: 0,
    gameCounts: {
      weekday: 0,
      weekend: 0,
      primetime: 0
    }
  };
  
  // Count games in various categories
  schedule.weeks.forEach(week => {
    week.matchups.forEach(matchup => {
      metrics.totalGames++;
      
      const dayOfWeek = matchup.date.getDay();
      const hourOfDay = matchup.date.getHours();
      
      // Weekend vs weekday
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        metrics.gameCounts.weekend++;
      } else {
        metrics.gameCounts.weekday++;
      }
      
      // Primetime (7-10pm)
      if (hourOfDay >= 19 && hourOfDay <= 22) {
        metrics.gameCounts.primetime++;
      }
      
      // Check if in premium window
      if (premiumWindows[dayOfWeek] && 
          hourOfDay >= premiumWindows[dayOfWeek][0] && 
          hourOfDay <= premiumWindows[dayOfWeek][1]) {
        metrics.gamesInPremiumWindows++;
      }
    });
  });
  
  // Calculate percentages
  metrics.premiumWindowPercentage = metrics.totalGames > 0 ? 
    (metrics.gamesInPremiumWindows / metrics.totalGames) * 100 : 0;
  
  return metrics;
}

/**
 * Generate individual team schedules
 * @param {Object} schedule - Main schedule
 * @returns {Object} Team-specific schedules
 */
function generateTeamSchedules(schedule) {
  const teamSchedules = {};
  
  // Create a game list for each team
  schedule.weeks.forEach(week => {
    week.matchups.forEach(matchup => {
      // Process home team
      if (!teamSchedules[matchup.homeTeam]) {
        teamSchedules[matchup.homeTeam] = [];
      }
      
      teamSchedules[matchup.homeTeam].push({
        opponent: matchup.awayTeam,
        date: matchup.date,
        isHome: true,
        week: matchup.week
      });
      
      // Process away team
      if (!teamSchedules[matchup.awayTeam]) {
        teamSchedules[matchup.awayTeam] = [];
      }
      
      teamSchedules[matchup.awayTeam].push({
        opponent: matchup.homeTeam,
        date: matchup.date,
        isHome: false,
        week: matchup.week
      });
    });
  });
  
  // Sort each team's schedule chronologically
  Object.keys(teamSchedules).forEach(teamId => {
    teamSchedules[teamId].sort((a, b) => a.date - b.date);
  });
  
  return teamSchedules;
} 