/**
 * FlexTime Scheduling Engine - Base Schedule Module
 * 
 * Handles the creation of the base schedule structure before optimization
 */

const winston = require('winston');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'flextime-base-schedule' },
  transports: [
    new winston.transports.File({ filename: 'logs/flextime-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/flextime-combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ],
});

/**
 * Create a base schedule from configuration
 * @param {Object} config - Configuration object
 * @returns {Object} Base schedule
 */
exports.createBaseSchedule = (config) => {
  logger.info('Creating base schedule', { sport: config.sport });
  
  // Select appropriate matchup generation function based on format
  let matchups;
  switch (config.competitionFormat) {
    case 'single-round-robin':
      matchups = generateSingleRoundRobin(config.teams);
      break;
    case 'double-round-robin':
      matchups = generateDoubleRoundRobin(config.teams);
      break;
    case 'partial-round-robin':
      matchups = generatePartialRoundRobin(config.teams, config.gamesPerTeam);
      break;
    case 'divisional':
      matchups = generateDivisionalSchedule(config.teams, config.gamesPerTeam);
      break;
    case 'three-game-series':
      matchups = generateSeriesSchedule(config.teams, 3);
      break;
    case 'dual-meet':
      matchups = generateDualMeetSchedule(config.teams, config.affiliates);
      break;
    default:
      matchups = generateSingleRoundRobin(config.teams);
  }
  
  // Assign home/away status to matchups
  const matchupsWithHomeAway = assignHomeAway(matchups, config);
  
  // Create weeks based on season length
  const weeks = createWeeks(config.seasonStart, config.seasonEnd);
  
  // Initial distribution of games across weeks
  const schedule = assignMatchupsToWeeks(matchupsWithHomeAway, weeks, config);
  
  logger.info('Base schedule created', { 
    matchupCount: matchups.length,
    weekCount: weeks.length
  });
  
  return schedule;
};

/**
 * Generate matchups for a single round-robin format
 * @param {Array} teams - List of teams
 * @returns {Array} List of matchups
 */
function generateSingleRoundRobin(teams) {
  const matchups = [];
  const n = teams.length;
  
  // Circle method for round-robin tournament scheduling
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      matchups.push({
        homeTeam: null, // Will be assigned later
        awayTeam: null, // Will be assigned later
        teams: [teams[i].id, teams[j].id],
        week: null, // Will be assigned later
        date: null, // Will be assigned later
        type: 'conference'
      });
    }
  }
  
  return matchups;
}

/**
 * Generate matchups for a double round-robin format
 * @param {Array} teams - List of teams
 * @returns {Array} List of matchups
 */
function generateDoubleRoundRobin(teams) {
  // Generate a single round-robin
  const firstRound = generateSingleRoundRobin(teams);
  
  // Clone and swap home/away for second round
  const secondRound = firstRound.map(matchup => ({
    ...matchup,
    teams: [...matchup.teams] // Clone teams array
  }));
  
  return [...firstRound, ...secondRound];
}

/**
 * Generate matchups for a partial round-robin (like football)
 * @param {Array} teams - List of teams
 * @param {number} gamesPerTeam - Number of games per team
 * @returns {Array} List of matchups
 */
function generatePartialRoundRobin(teams, gamesPerTeam) {
  const n = teams.length;
  const totalOpponents = n - 1;
  
  // If gamesPerTeam equals totalOpponents, this is just a single round-robin
  if (gamesPerTeam >= totalOpponents) {
    return generateSingleRoundRobin(teams);
  }
  
  // Create balanced partial schedule
  const matchups = [];
  
  // Assign opponents to each team
  for (let i = 0; i < n; i++) {
    // Calculate opponents indices with balanced distribution
    const opponentIndices = [];
    const step = totalOpponents / gamesPerTeam;
    
    for (let j = 0; j < gamesPerTeam; j++) {
      const index = (i + Math.floor(j * step) + 1) % n;
      opponentIndices.push(index);
    }
    
    // Add matchups for this team's opponents
    for (const opponentIndex of opponentIndices) {
      // Only add matchup if not already in the list
      const teamsInvolved = [teams[i].id, teams[opponentIndex].id].sort();
      const matchupExists = matchups.some(m => 
        m.teams.includes(teamsInvolved[0]) && m.teams.includes(teamsInvolved[1])
      );
      
      if (!matchupExists) {
        matchups.push({
          homeTeam: null,
          awayTeam: null,
          teams: [teams[i].id, teams[opponentIndex].id],
          week: null,
          date: null,
          type: 'conference'
        });
      }
    }
  }
  
  return matchups;
}

/**
 * Generate matchups for a divisional format
 * @param {Array} teams - List of teams
 * @param {number} gamesPerTeam - Number of games per team
 * @returns {Array} List of matchups
 */
function generateDivisionalSchedule(teams, gamesPerTeam) {
  // Group teams by division
  const divisions = {};
  teams.forEach(team => {
    const division = team.division || 'default';
    if (!divisions[division]) divisions[division] = [];
    divisions[division].push(team);
  });
  
  const matchups = [];
  
  // Create in-division matchups (full round-robin within division)
  Object.values(divisions).forEach(divisionTeams => {
    const divisionMatchups = generateSingleRoundRobin(divisionTeams);
    matchups.push(...divisionMatchups);
  });
  
  // Create cross-division matchups as needed
  const divisionNames = Object.keys(divisions);
  
  // If we have more than one division, add cross-division games
  if (divisionNames.length > 1) {
    for (let i = 0; i < divisionNames.length; i++) {
      for (let j = i + 1; j < divisionNames.length; j++) {
        const div1 = divisions[divisionNames[i]];
        const div2 = divisions[divisionNames[j]];
        
        // Pair teams across divisions
        for (let k = 0; k < Math.min(div1.length, div2.length); k++) {
          matchups.push({
            homeTeam: null,
            awayTeam: null,
            teams: [div1[k % div1.length].id, div2[k % div2.length].id],
            week: null,
            date: null,
            type: 'conference'
          });
        }
      }
    }
  }
  
  return matchups;
}

/**
 * Generate matchups for series-based sports (baseball, softball)
 * @param {Array} teams - List of teams
 * @param {number} seriesLength - Number of games in a series
 * @returns {Array} List of matchups
 */
function generateSeriesSchedule(teams, seriesLength) {
  // Start with a single round-robin format
  const series = generateSingleRoundRobin(teams);
  const matchups = [];
  
  // For each series, create multiple games
  series.forEach(s => {
    for (let i = 0; i < seriesLength; i++) {
      matchups.push({
        ...s,
        seriesGame: i + 1,
        seriesId: `${s.teams[0]}-${s.teams[1]}`
      });
    }
  });
  
  return matchups;
}

/**
 * Generate matchups for a dual meet schedule with affiliates
 * @param {Array} teams - List of teams
 * @param {Array} affiliates - List of affiliate teams
 * @returns {Array} List of matchups
 */
function generateDualMeetSchedule(teams, affiliates) {
  // Combine regular conference teams and affiliates
  const allTeams = [...teams, ...affiliates];
  
  // Generate base matchups like a single round-robin
  return generateSingleRoundRobin(allTeams);
}

/**
 * Assign home and away status to matchups
 * @param {Array} matchups - List of matchups
 * @param {Object} config - Configuration object
 * @returns {Array} Matchups with home/away assignments
 */
function assignHomeAway(matchups, config) {
  const homeAwayBalance = {};
  
  // Initialize home/away balance counter for each team
  config.teams.forEach(team => {
    homeAwayBalance[team.id] = 0; // positive = more home games, negative = more away games
  });
  
  if (config.affiliates) {
    config.affiliates.forEach(team => {
      homeAwayBalance[team.id] = 0;
    });
  }
  
  // For double round-robin, assign opposite home/away status for return fixtures
  if (config.competitionFormat === 'double-round-robin') {
    const matchupCount = matchups.length;
    const halfPoint = matchupCount / 2;
    
    for (let i = 0; i < halfPoint; i++) {
      const firstHalfMatchup = matchups[i];
      const secondHalfMatchup = matchups[i + halfPoint];
      
      // First team is home in first half
      firstHalfMatchup.homeTeam = firstHalfMatchup.teams[0];
      firstHalfMatchup.awayTeam = firstHalfMatchup.teams[1];
      
      // First team is away in second half
      secondHalfMatchup.homeTeam = secondHalfMatchup.teams[1];
      secondHalfMatchup.awayTeam = secondHalfMatchup.teams[0];
      
      // Update home/away balance (overall should be balanced)
      homeAwayBalance[firstHalfMatchup.homeTeam]++;
      homeAwayBalance[firstHalfMatchup.awayTeam]--;
      homeAwayBalance[secondHalfMatchup.homeTeam]++;
      homeAwayBalance[secondHalfMatchup.awayTeam]--;
    }
  } 
  // For series-based schedules, assign same home/away for all games in series
  else if (config.competitionFormat === 'three-game-series') {
    const seriesMap = {};
    
    matchups.forEach(matchup => {
      if (!seriesMap[matchup.seriesId]) {
        // Randomly assign home/away for each series
        const random = Math.random();
        const homeTeamIndex = random < 0.5 ? 0 : 1;
        const awayTeamIndex = 1 - homeTeamIndex;
        
        seriesMap[matchup.seriesId] = {
          homeTeam: matchup.teams[homeTeamIndex],
          awayTeam: matchup.teams[awayTeamIndex]
        };
        
        // Update balance
        homeAwayBalance[matchup.teams[homeTeamIndex]] += 3; // 3 home games
        homeAwayBalance[matchup.teams[awayTeamIndex]] -= 3; // 3 away games
      }
      
      // Assign from series map
      matchup.homeTeam = seriesMap[matchup.seriesId].homeTeam;
      matchup.awayTeam = seriesMap[matchup.seriesId].awayTeam;
    });
  }
  // For other formats, balance home/away as much as possible
  else {
    matchups.forEach(matchup => {
      const team1 = matchup.teams[0];
      const team2 = matchup.teams[1];
      
      // Team with fewer home games gets home advantage
      if (homeAwayBalance[team1] <= homeAwayBalance[team2]) {
        matchup.homeTeam = team1;
        matchup.awayTeam = team2;
      } else {
        matchup.homeTeam = team2;
        matchup.awayTeam = team1;
      }
      
      // Update balance
      homeAwayBalance[matchup.homeTeam]++;
      homeAwayBalance[matchup.awayTeam]--;
    });
  }
  
  return matchups;
}

/**
 * Create week objects for the entire season
 * @param {Date} seasonStart - Season start date
 * @param {Date} seasonEnd - Season end date
 * @returns {Array} Array of week objects
 */
function createWeeks(seasonStart, seasonEnd) {
  const weeks = [];
  const oneDay = 24 * 60 * 60 * 1000;
  const oneWeek = 7 * oneDay;
  
  let currentDate = new Date(seasonStart);
  let weekIndex = 1;
  
  while (currentDate <= seasonEnd) {
    const weekStart = new Date(currentDate);
    const weekEnd = new Date(currentDate.getTime() + oneWeek - oneDay);
    
    // Adjust weekEnd if it exceeds season end
    const adjustedWeekEnd = weekEnd <= seasonEnd ? weekEnd : new Date(seasonEnd);
    
    weeks.push({
      index: weekIndex,
      start: weekStart,
      end: adjustedWeekEnd,
      days: getDaysInRange(weekStart, adjustedWeekEnd),
      matchups: []
    });
    
    currentDate = new Date(currentDate.getTime() + oneWeek);
    weekIndex++;
  }
  
  return weeks;
}

/**
 * Get array of dates in a range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} Array of dates
 */
function getDaysInRange(startDate, endDate) {
  const days = [];
  const oneDay = 24 * 60 * 60 * 1000;
  
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    days.push(new Date(currentDate));
    currentDate = new Date(currentDate.getTime() + oneDay);
  }
  
  return days;
}

/**
 * Assign matchups to weeks evenly
 * @param {Array} matchups - List of matchups
 * @param {Array} weeks - List of weeks
 * @param {Object} config - Configuration object
 * @returns {Object} Schedule object with weeks and matchups
 */
function assignMatchupsToWeeks(matchups, weeks, config) {
  // Create a copy of matchups to work with
  const unscheduledMatchups = [...matchups];
  const teamWeeklyGames = {};
  
  // Initialize team game counter for each week
  config.teams.forEach(team => {
    teamWeeklyGames[team.id] = weeks.map(() => 0);
  });
  
  if (config.affiliates) {
    config.affiliates.forEach(team => {
      teamWeeklyGames[team.id] = weeks.map(() => 0);
    });
  }
  
  // For each week, assign a balanced number of games
  weeks.forEach((week, weekIndex) => {
    // Skip weeks designated as breaks if any
    if (config.breakWeeks && config.breakWeeks.includes(weekIndex + 1)) {
      return;
    }
    
    // Calculate target games per team per week based on sport
    let targetGamesPerTeam = 1;
    if (config.sport.toLowerCase() === 'basketball') {
      targetGamesPerTeam = 2; // Basketball typically has 2 games per week
    } else if (['baseball', 'softball'].includes(config.sport.toLowerCase())) {
      targetGamesPerTeam = 3; // Baseball/softball have 3-game series
    }
    
    // Copy the week for modification
    const weekSchedule = {...week};
    
    // Distribute games across days of the week based on sport
    if (config.sport.toLowerCase() === 'football') {
      // Football games are typically on Saturdays
      const gameDays = weekSchedule.days.filter(d => d.getDay() === 6); // Saturday = 6
      if (gameDays.length === 0) gameDays.push(weekSchedule.days[0]); // Fallback
      
      // Assign games to this week, up to maximum
      const gamesThisWeek = [];
      
      while (unscheduledMatchups.length > 0) {
        // Find a matchup where both teams don't already have a game this week
        const matchupIndex = unscheduledMatchups.findIndex(m => 
          teamWeeklyGames[m.homeTeam][weekIndex] < targetGamesPerTeam && 
          teamWeeklyGames[m.awayTeam][weekIndex] < targetGamesPerTeam
        );
        
        if (matchupIndex === -1) break; // No suitable matchup found
        
        const matchup = unscheduledMatchups.splice(matchupIndex, 1)[0];
        
        // Assign to a game day (typically Saturday for football)
        matchup.week = weekIndex + 1;
        matchup.date = gameDays[gamesThisWeek.length % gameDays.length];
        
        // Update team game counters
        teamWeeklyGames[matchup.homeTeam][weekIndex]++;
        teamWeeklyGames[matchup.awayTeam][weekIndex]++;
        
        gamesThisWeek.push(matchup);
      }
      
      weekSchedule.matchups = gamesThisWeek;
    } 
    else if (['basketball', 'volleyball'].includes(config.sport.toLowerCase())) {
      // Basketball/volleyball typically play weeknight games plus weekend
      // Prefer Wednesday/Saturday or Thursday/Sunday pairs
      const wedSatWeek = weekSchedule.days.filter(d => [3, 6].includes(d.getDay())); // Wed(3)/Sat(6)
      const thuSunWeek = weekSchedule.days.filter(d => [4, 0].includes(d.getDay())); // Thu(4)/Sun(0)
      
      const gameDays = wedSatWeek.length === 2 ? wedSatWeek : 
                      (thuSunWeek.length === 2 ? thuSunWeek : weekSchedule.days.slice(0, 2));
      
      // Assign games to this week, up to maximum
      const gamesThisWeek = [];
      
      while (unscheduledMatchups.length > 0) {
        // Find matchups where both teams still have slots available this week
        const matchupIndex = unscheduledMatchups.findIndex(m => 
          teamWeeklyGames[m.homeTeam][weekIndex] < targetGamesPerTeam && 
          teamWeeklyGames[m.awayTeam][weekIndex] < targetGamesPerTeam
        );
        
        if (matchupIndex === -1) break; // No suitable matchup found
        
        const matchup = unscheduledMatchups.splice(matchupIndex, 1)[0];
        
        // Assign to a game day
        matchup.week = weekIndex + 1;
        matchup.date = gameDays[gamesThisWeek.length % gameDays.length];
        
        // Update team game counters
        teamWeeklyGames[matchup.homeTeam][weekIndex]++;
        teamWeeklyGames[matchup.awayTeam][weekIndex]++;
        
        gamesThisWeek.push(matchup);
      }
      
      weekSchedule.matchups = gamesThisWeek;
    }
    else if (['baseball', 'softball'].includes(config.sport.toLowerCase())) {
      // Baseball/softball typically play 3-game weekend series (Fri-Sun)
      const weekendDays = weekSchedule.days.filter(d => [5, 6, 0].includes(d.getDay())); // Fri(5)/Sat(6)/Sun(0)
      
      // Group matchups by series
      const seriesGroups = {};
      unscheduledMatchups.forEach(m => {
        if (!seriesGroups[m.seriesId]) seriesGroups[m.seriesId] = [];
        seriesGroups[m.seriesId].push(m);
      });
      
      // Assign series to this week
      const gamesThisWeek = [];
      
      // If we have weekend days, assign series to them
      if (weekendDays.length >= 3) {
        // Process each series
        const seriesIds = Object.keys(seriesGroups);
        for (const seriesId of seriesIds) {
          // Check if teams in this series already have games this week
          const gamesInSeries = seriesGroups[seriesId];
          if (gamesInSeries.length === 0) continue;
          
          const homeTeam = gamesInSeries[0].homeTeam;
          const awayTeam = gamesInSeries[0].awayTeam;
          
          // Only schedule if teams don't already have games this week
          if (teamWeeklyGames[homeTeam][weekIndex] === 0 && 
              teamWeeklyGames[awayTeam][weekIndex] === 0) {
            
            // Assign each game to Fri/Sat/Sun
            gamesInSeries.forEach((game, i) => {
              if (i < weekendDays.length) {
                game.week = weekIndex + 1;
                game.date = weekendDays[i];
                
                // Remove from unscheduled list
                const index = unscheduledMatchups.findIndex(m => 
                  m.seriesId === game.seriesId && m.seriesGame === game.seriesGame
                );
                if (index !== -1) unscheduledMatchups.splice(index, 1);
                
                // Add to this week's games
                gamesThisWeek.push(game);
              }
            });
            
            // Update team game counters for the full series
            teamWeeklyGames[homeTeam][weekIndex] += gamesInSeries.length;
            teamWeeklyGames[awayTeam][weekIndex] += gamesInSeries.length;
            
            // Remove this series from consideration for other weeks
            delete seriesGroups[seriesId];
          }
        }
      }
      
      weekSchedule.matchups = gamesThisWeek;
    }
    else {
      // Default distribution for other sports
      const gameDays = weekSchedule.days;
      
      // Assign games to this week, up to maximum
      const gamesThisWeek = [];
      
      while (unscheduledMatchups.length > 0) {
        // Find matchups where both teams still have slots available this week
        const matchupIndex = unscheduledMatchups.findIndex(m => 
          teamWeeklyGames[m.homeTeam][weekIndex] < targetGamesPerTeam && 
          teamWeeklyGames[m.awayTeam][weekIndex] < targetGamesPerTeam
        );
        
        if (matchupIndex === -1) break; // No suitable matchup found
        
        const matchup = unscheduledMatchups.splice(matchupIndex, 1)[0];
        
        // Assign to a game day
        matchup.week = weekIndex + 1;
        matchup.date = gameDays[gamesThisWeek.length % gameDays.length];
        
        // Update team game counters
        teamWeeklyGames[matchup.homeTeam][weekIndex]++;
        teamWeeklyGames[matchup.awayTeam][weekIndex]++;
        
        gamesThisWeek.push(matchup);
      }
      
      weekSchedule.matchups = gamesThisWeek;
    }
    
    // Update the week in the weeks array
    weeks[weekIndex] = weekSchedule;
  });
  
  return {
    sport: config.sport,
    seasonStart: config.seasonStart,
    seasonEnd: config.seasonEnd,
    format: config.competitionFormat,
    weeks: weeks,
    unscheduledMatchups: unscheduledMatchups
  };
} 