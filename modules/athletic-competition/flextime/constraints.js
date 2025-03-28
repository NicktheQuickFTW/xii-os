/**
 * FlexTime Scheduling Engine - Constraints Module
 * 
 * Handles application and validation of scheduling constraints
 */

const winston = require('winston');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'flextime-constraints' },
  transports: [
    new winston.transports.File({ filename: 'logs/flextime-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/flextime-combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ],
});

/**
 * Apply constraints to a schedule
 * @param {Object} schedule - Base schedule
 * @param {Object} config - Configuration object
 * @returns {Object} Schedule with constraints applied
 */
exports.applyConstraints = (schedule, config) => {
  logger.info('Applying constraints to schedule', { sport: config.sport });
  
  let modifiedSchedule = {...schedule};
  let unscheduledMatchups = [...schedule.unscheduledMatchups];
  
  // Copy weeks for modification
  const weeks = schedule.weeks.map(week => ({...week, matchups: [...week.matchups]}));
  
  // Apply institutional constraints (religious, etc.)
  modifiedSchedule = applyInstitutionalConstraints(modifiedSchedule, config);
  
  // Apply venue constraints
  modifiedSchedule = applyVenueConstraints(modifiedSchedule, config);
  
  // Apply academic calendar constraints
  modifiedSchedule = applyAcademicCalendarConstraints(modifiedSchedule, config);
  
  // Apply existing commitments
  modifiedSchedule = applyExistingCommitments(modifiedSchedule, config);
  
  // Verify feasibility
  const feasibility = verifyFeasibility(modifiedSchedule);
  if (!feasibility.feasible) {
    logger.warn('Schedule is not feasible after applying constraints', feasibility.issues);
    
    // Try to resolve feasibility issues
    modifiedSchedule = attemptConstraintRelaxation(modifiedSchedule, feasibility.issues, config);
  }
  
  logger.info('Constraints applied to schedule', { 
    constraintsApplied: true,
    unscheduledGames: modifiedSchedule.unscheduledMatchups.length
  });
  
  return modifiedSchedule;
};

/**
 * Apply institutional constraints like BYU's no-Sunday policy
 * @param {Object} schedule - Schedule to modify
 * @param {Object} config - Configuration object
 * @returns {Object} Modified schedule
 */
function applyInstitutionalConstraints(schedule, config) {
  const institutionalConstraints = config.institutionalConstraints || [];
  if (institutionalConstraints.length === 0) return schedule;
  
  logger.info('Applying institutional constraints', { count: institutionalConstraints.length });
  
  // Copy schedule for modification
  const modifiedSchedule = {
    ...schedule,
    weeks: schedule.weeks.map(week => ({...week})),
    unscheduledMatchups: [...schedule.unscheduledMatchups]
  };
  
  // Process each week's matchups
  modifiedSchedule.weeks.forEach((week, weekIndex) => {
    // Copy matchups for this week
    const weekMatchups = [...week.matchups];
    const rescheduledMatchups = [];
    
    // Check each matchup against institutional constraints
    for (let i = weekMatchups.length - 1; i >= 0; i--) {
      const matchup = weekMatchups[i];
      const violatesConstraint = institutionalConstraints.some(constraint => {
        // Check if matchup involves team with constraint
        if (matchup.homeTeam === constraint.teamId || matchup.awayTeam === constraint.teamId) {
          // Check if constraint applies to this date
          if (constraint.type === 'no-play-day-of-week') {
            return matchup.date.getDay() === constraint.dayOfWeek;
          } else if (constraint.type === 'no-play-date-range') {
            return matchup.date >= new Date(constraint.startDate) && 
                   matchup.date <= new Date(constraint.endDate);
          }
        }
        return false;
      });
      
      if (violatesConstraint) {
        // Remove matchup from this week
        const removedMatchup = weekMatchups.splice(i, 1)[0];
        rescheduledMatchups.push(removedMatchup);
      }
    }
    
    // Update week's matchups
    modifiedSchedule.weeks[weekIndex].matchups = weekMatchups;
    
    // Add rescheduled matchups to unscheduled list
    modifiedSchedule.unscheduledMatchups = [
      ...modifiedSchedule.unscheduledMatchups,
      ...rescheduledMatchups
    ];
  });
  
  return modifiedSchedule;
}

/**
 * Apply venue availability constraints
 * @param {Object} schedule - Schedule to modify
 * @param {Object} config - Configuration object
 * @returns {Object} Modified schedule
 */
function applyVenueConstraints(schedule, config) {
  const venueConflicts = config.venueConflicts || [];
  if (venueConflicts.length === 0) return schedule;
  
  logger.info('Applying venue constraints', { count: venueConflicts.length });
  
  // Copy schedule for modification
  const modifiedSchedule = {
    ...schedule,
    weeks: schedule.weeks.map(week => ({...week})),
    unscheduledMatchups: [...schedule.unscheduledMatchups]
  };
  
  // Get team venue mapping
  const teamVenues = {};
  config.teams.forEach(team => {
    if (team.venue) {
      teamVenues[team.id] = team.venue;
    }
  });
  
  // Process each week's matchups
  modifiedSchedule.weeks.forEach((week, weekIndex) => {
    // Copy matchups for this week
    const weekMatchups = [...week.matchups];
    const rescheduledMatchups = [];
    
    // Check each matchup against venue conflicts
    for (let i = weekMatchups.length - 1; i >= 0; i--) {
      const matchup = weekMatchups[i];
      const homeTeamVenue = teamVenues[matchup.homeTeam];
      
      // Skip if we don't know the venue
      if (!homeTeamVenue) continue;
      
      const venueConflict = venueConflicts.some(conflict => {
        return conflict.venue === homeTeamVenue &&
               matchup.date >= new Date(conflict.startDate) &&
               matchup.date <= new Date(conflict.endDate);
      });
      
      if (venueConflict) {
        // Remove matchup from this week
        const removedMatchup = weekMatchups.splice(i, 1)[0];
        rescheduledMatchups.push(removedMatchup);
      }
    }
    
    // Update week's matchups
    modifiedSchedule.weeks[weekIndex].matchups = weekMatchups;
    
    // Add rescheduled matchups to unscheduled list
    modifiedSchedule.unscheduledMatchups = [
      ...modifiedSchedule.unscheduledMatchups,
      ...rescheduledMatchups
    ];
  });
  
  return modifiedSchedule;
}

/**
 * Apply academic calendar constraints (exam periods, etc.)
 * @param {Object} schedule - Schedule to modify
 * @param {Object} config - Configuration object
 * @returns {Object} Modified schedule
 */
function applyAcademicCalendarConstraints(schedule, config) {
  const academicCalendars = config.academicCalendars || {};
  if (Object.keys(academicCalendars).length === 0) return schedule;
  
  logger.info('Applying academic calendar constraints');
  
  // Copy schedule for modification
  const modifiedSchedule = {
    ...schedule,
    weeks: schedule.weeks.map(week => ({...week})),
    unscheduledMatchups: [...schedule.unscheduledMatchups]
  };
  
  // Process each week's matchups
  modifiedSchedule.weeks.forEach((week, weekIndex) => {
    // Copy matchups for this week
    const weekMatchups = [...week.matchups];
    const rescheduledMatchups = [];
    
    // Check each matchup against academic calendars
    for (let i = weekMatchups.length - 1; i >= 0; i--) {
      const matchup = weekMatchups[i];
      const homeTeamCalendar = academicCalendars[matchup.homeTeam] || [];
      const awayTeamCalendar = academicCalendars[matchup.awayTeam] || [];
      
      // Check if date conflicts with exam periods for either team
      const hasAcademicConflict = [...homeTeamCalendar, ...awayTeamCalendar].some(period => {
        return period.type === 'exams' &&
               matchup.date >= new Date(period.startDate) &&
               matchup.date <= new Date(period.endDate);
      });
      
      if (hasAcademicConflict) {
        // Remove matchup from this week
        const removedMatchup = weekMatchups.splice(i, 1)[0];
        rescheduledMatchups.push(removedMatchup);
      }
    }
    
    // Update week's matchups
    modifiedSchedule.weeks[weekIndex].matchups = weekMatchups;
    
    // Add rescheduled matchups to unscheduled list
    modifiedSchedule.unscheduledMatchups = [
      ...modifiedSchedule.unscheduledMatchups,
      ...rescheduledMatchups
    ];
  });
  
  return modifiedSchedule;
}

/**
 * Apply existing game commitments
 * @param {Object} schedule - Schedule to modify
 * @param {Object} config - Configuration object
 * @returns {Object} Modified schedule
 */
function applyExistingCommitments(schedule, config) {
  const existingCommitments = config.existingCommitments || [];
  if (existingCommitments.length === 0) return schedule;
  
  logger.info('Applying existing game commitments', { count: existingCommitments.length });
  
  // Copy schedule for modification
  const modifiedSchedule = {
    ...schedule,
    weeks: schedule.weeks.map(week => ({...week})),
    unscheduledMatchups: [...schedule.unscheduledMatchups]
  };
  
  // First, remove any matchups that conflict with existing commitments
  modifiedSchedule.weeks.forEach((week, weekIndex) => {
    // Copy matchups for this week
    const weekMatchups = [...week.matchups];
    const rescheduledMatchups = [];
    
    // Check each matchup against existing commitments
    for (let i = weekMatchups.length - 1; i >= 0; i--) {
      const matchup = weekMatchups[i];
      
      const conflictsWithExisting = existingCommitments.some(commitment => {
        // Check if commitment involves either team on the same day
        const teamInvolved = matchup.homeTeam === commitment.homeTeam || 
                            matchup.homeTeam === commitment.awayTeam ||
                            matchup.awayTeam === commitment.homeTeam || 
                            matchup.awayTeam === commitment.awayTeam;
                            
        const sameDay = matchup.date.toDateString() === new Date(commitment.date).toDateString();
        
        return teamInvolved && sameDay;
      });
      
      if (conflictsWithExisting) {
        // Remove matchup from this week
        const removedMatchup = weekMatchups.splice(i, 1)[0];
        rescheduledMatchups.push(removedMatchup);
      }
    }
    
    // Update week's matchups
    modifiedSchedule.weeks[weekIndex].matchups = weekMatchups;
    
    // Add rescheduled matchups to unscheduled list
    modifiedSchedule.unscheduledMatchups = [
      ...modifiedSchedule.unscheduledMatchups,
      ...rescheduledMatchups
    ];
  });
  
  // Then, add the existing commitments to the schedule
  existingCommitments.forEach(commitment => {
    const commitmentDate = new Date(commitment.date);
    
    // Find the week for this commitment
    const weekIndex = modifiedSchedule.weeks.findIndex(week => 
      commitmentDate >= week.start && commitmentDate <= week.end
    );
    
    if (weekIndex !== -1) {
      // Create a matchup object for the commitment
      const commitmentMatchup = {
        homeTeam: commitment.homeTeam,
        awayTeam: commitment.awayTeam,
        teams: [commitment.homeTeam, commitment.awayTeam],
        week: weekIndex + 1,
        date: commitmentDate,
        type: commitment.type || 'conference',
        isExistingCommitment: true
      };
      
      // Add to the week's matchups
      modifiedSchedule.weeks[weekIndex].matchups.push(commitmentMatchup);
    }
  });
  
  return modifiedSchedule;
}

/**
 * Verify schedule feasibility
 * @param {Object} schedule - Schedule to check
 * @returns {Object} Feasibility result with issues
 */
function verifyFeasibility(schedule) {
  const issues = [];
  
  // Check if we have too many unscheduled matchups
  if (schedule.unscheduledMatchups.length > 0) {
    issues.push({
      type: 'unscheduled-games',
      count: schedule.unscheduledMatchups.length,
      description: `${schedule.unscheduledMatchups.length} games could not be scheduled due to constraints`
    });
  }
  
  // Check for teams playing multiple games on the same day
  schedule.weeks.forEach(week => {
    const teamGameDays = {};
    
    week.matchups.forEach(matchup => {
      const dateString = matchup.date.toDateString();
      
      // Track home team games
      if (!teamGameDays[matchup.homeTeam]) {
        teamGameDays[matchup.homeTeam] = {};
      }
      if (!teamGameDays[matchup.homeTeam][dateString]) {
        teamGameDays[matchup.homeTeam][dateString] = [];
      }
      teamGameDays[matchup.homeTeam][dateString].push(matchup);
      
      // Track away team games
      if (!teamGameDays[matchup.awayTeam]) {
        teamGameDays[matchup.awayTeam] = {};
      }
      if (!teamGameDays[matchup.awayTeam][dateString]) {
        teamGameDays[matchup.awayTeam][dateString] = [];
      }
      teamGameDays[matchup.awayTeam][dateString].push(matchup);
    });
    
    // Check for multiple games on same day
    Object.entries(teamGameDays).forEach(([teamId, days]) => {
      Object.entries(days).forEach(([date, games]) => {
        if (games.length > 1) {
          issues.push({
            type: 'multiple-games-same-day',
            teamId,
            date,
            games: games.length,
            description: `Team ${teamId} has ${games.length} games scheduled on ${date}`
          });
        }
      });
    });
  });
  
  // Check travel feasibility (back-to-back away games with long travel)
  const consecutiveDayIssues = checkConsecutiveDayTravel(schedule);
  issues.push(...consecutiveDayIssues);
  
  return {
    feasible: issues.length === 0,
    issues
  };
}

/**
 * Check for travel feasibility issues with consecutive games
 * @param {Object} schedule - Schedule to check
 * @returns {Array} Travel issues found
 */
function checkConsecutiveDayTravel(schedule) {
  const issues = [];
  
  // Create a map of all games by team and date
  const teamGames = {};
  
  // Initialize team games map
  schedule.weeks.forEach(week => {
    week.matchups.forEach(matchup => {
      // Add home team game
      if (!teamGames[matchup.homeTeam]) {
        teamGames[matchup.homeTeam] = [];
      }
      teamGames[matchup.homeTeam].push({
        date: matchup.date,
        opponent: matchup.awayTeam,
        isHome: true,
        matchup
      });
      
      // Add away team game
      if (!teamGames[matchup.awayTeam]) {
        teamGames[matchup.awayTeam] = [];
      }
      teamGames[matchup.awayTeam].push({
        date: matchup.date,
        opponent: matchup.homeTeam,
        isHome: false,
        matchup
      });
    });
  });
  
  // Sort each team's games by date
  Object.keys(teamGames).forEach(teamId => {
    teamGames[teamId].sort((a, b) => a.date - b.date);
  });
  
  // Check for consecutive away games with minimal rest
  Object.entries(teamGames).forEach(([teamId, games]) => {
    for (let i = 0; i < games.length - 1; i++) {
      const currentGame = games[i];
      const nextGame = games[i + 1];
      
      // Calculate days between games
      const daysBetween = Math.round((nextGame.date - currentGame.date) / (24 * 60 * 60 * 1000));
      
      // Flag consecutive away games with 0 or 1 day of rest
      if (!currentGame.isHome && !nextGame.isHome && daysBetween <= 1) {
        issues.push({
          type: 'consecutive-away-games',
          teamId,
          dates: [currentGame.date.toDateString(), nextGame.date.toDateString()],
          daysBetween,
          description: `Team ${teamId} has consecutive away games with only ${daysBetween} day(s) rest`
        });
      }
    }
  });
  
  return issues;
}

/**
 * Attempt to relax constraints to achieve feasibility
 * @param {Object} schedule - Infeasible schedule
 * @param {Array} issues - Feasibility issues
 * @param {Object} config - Configuration object
 * @returns {Object} Schedule with relaxed constraints
 */
function attemptConstraintRelaxation(schedule, issues, config) {
  logger.info('Attempting constraint relaxation', { issueCount: issues.length });
  
  // Copy schedule for modification
  const modifiedSchedule = {
    ...schedule,
    weeks: schedule.weeks.map(week => ({...week})),
    unscheduledMatchups: [...schedule.unscheduledMatchups]
  };
  
  // Try to reschedule unscheduled matchups with relaxed constraints
  const unscheduledIssue = issues.find(i => i.type === 'unscheduled-games');
  
  if (unscheduledIssue && modifiedSchedule.unscheduledMatchups.length > 0) {
    // Find available slots with relaxed constraints
    const relaxedSlots = findRelaxedSlots(modifiedSchedule, config);
    
    // Try to assign unscheduled matchups to relaxed slots
    const stillUnscheduled = [];
    
    modifiedSchedule.unscheduledMatchups.forEach(matchup => {
      // Find a suitable slot for this matchup
      const slotIndex = relaxedSlots.findIndex(slot => {
        // Check if teams are available on this day with relaxed constraints
        return !hasGameOnDate(modifiedSchedule, matchup.homeTeam, slot.date) && 
               !hasGameOnDate(modifiedSchedule, matchup.awayTeam, slot.date);
      });
      
      if (slotIndex !== -1) {
        // Assign matchup to this slot
        const slot = relaxedSlots.splice(slotIndex, 1)[0];
        
        matchup.week = slot.weekIndex + 1;
        matchup.date = slot.date;
        matchup.relaxedConstraint = true;
        
        // Add to week's matchups
        modifiedSchedule.weeks[slot.weekIndex].matchups.push(matchup);
      } else {
        // Couldn't find a slot even with relaxed constraints
        stillUnscheduled.push(matchup);
      }
    });
    
    // Update unscheduled matchups
    modifiedSchedule.unscheduledMatchups = stillUnscheduled;
  }
  
  // Try to resolve multiple-games-same-day issues
  const multipleGameIssues = issues.filter(i => i.type === 'multiple-games-same-day');
  
  if (multipleGameIssues.length > 0) {
    multipleGameIssues.forEach(issue => {
      // Find the week with the problematic games
      const weekIndex = modifiedSchedule.weeks.findIndex(week => 
        week.matchups.some(matchup => 
          (matchup.homeTeam === issue.teamId || matchup.awayTeam === issue.teamId) && 
          matchup.date.toDateString() === issue.date
        )
      );
      
      if (weekIndex !== -1) {
        // Get the problematic games
        const problemGames = modifiedSchedule.weeks[weekIndex].matchups.filter(matchup => 
          (matchup.homeTeam === issue.teamId || matchup.awayTeam === issue.teamId) && 
          matchup.date.toDateString() === issue.date
        );
        
        // Keep the first game, move others to adjacent days
        if (problemGames.length > 1) {
          // Find available days in this week
          const availableDays = modifiedSchedule.weeks[weekIndex].days.filter(day => 
            day.toDateString() !== issue.date &&
            !hasGameOnDate(modifiedSchedule, issue.teamId, day)
          );
          
          // Move excess games to available days
          for (let i = 1; i < problemGames.length && availableDays.length > 0; i++) {
            const gameToMove = problemGames[i];
            const newDate = availableDays.shift();
            
            // Update the game's date
            const matchupIndex = modifiedSchedule.weeks[weekIndex].matchups.findIndex(m => 
              m === gameToMove
            );
            
            if (matchupIndex !== -1) {
              modifiedSchedule.weeks[weekIndex].matchups[matchupIndex].date = newDate;
              modifiedSchedule.weeks[weekIndex].matchups[matchupIndex].relaxedConstraint = true;
            }
          }
        }
      }
    });
  }
  
  return modifiedSchedule;
}

/**
 * Find available slots with relaxed constraints
 * @param {Object} schedule - Schedule to check
 * @param {Object} config - Configuration object
 * @returns {Array} Available slots
 */
function findRelaxedSlots(schedule, config) {
  const relaxedSlots = [];
  
  // Check each week for possible slots
  schedule.weeks.forEach((week, weekIndex) => {
    week.days.forEach(day => {
      // Include slots that would normally be excluded due to constraints
      
      // Skip only high-priority constraints like existing commitments
      const isHighPriorityConflict = config.existingCommitments?.some(commitment => {
        const commitmentDate = new Date(commitment.date);
        return day.toDateString() === commitmentDate.toDateString();
      });
      
      if (!isHighPriorityConflict) {
        relaxedSlots.push({
          weekIndex,
          date: day,
          relaxed: true
        });
      }
    });
  });
  
  return relaxedSlots;
}

/**
 * Check if a team has a game on a specific date
 * @param {Object} schedule - Schedule to check
 * @param {string} teamId - Team ID
 * @param {Date} date - Date to check
 * @returns {boolean} Whether team has a game on date
 */
function hasGameOnDate(schedule, teamId, date) {
  // Find the week containing this date
  const weekIndex = schedule.weeks.findIndex(week => 
    date >= week.start && date <= week.end
  );
  
  if (weekIndex === -1) return false;
  
  // Check if team has a game on this date
  return schedule.weeks[weekIndex].matchups.some(matchup => 
    (matchup.homeTeam === teamId || matchup.awayTeam === teamId) && 
    matchup.date.toDateString() === date.toDateString()
  );
}

/**
 * Validate a schedule against constraints
 * @param {Object} schedule - Schedule to validate
 * @returns {Object} Validation result
 */
exports.validateSchedule = (schedule) => {
  const violations = [];
  
  // Check for any unscheduled matchups
  if (schedule.unscheduledMatchups && schedule.unscheduledMatchups.length > 0) {
    violations.push({
      type: 'unscheduled-games',
      count: schedule.unscheduledMatchups.length,
      description: `${schedule.unscheduledMatchups.length} games remain unscheduled`
    });
  }
  
  // Check for teams playing multiple games on the same day
  schedule.weeks.forEach(week => {
    const teamGameDays = {};
    
    week.matchups.forEach(matchup => {
      const dateString = matchup.date.toDateString();
      
      // Track home team games
      if (!teamGameDays[matchup.homeTeam]) {
        teamGameDays[matchup.homeTeam] = {};
      }
      if (!teamGameDays[matchup.homeTeam][dateString]) {
        teamGameDays[matchup.homeTeam][dateString] = [];
      }
      teamGameDays[matchup.homeTeam][dateString].push(matchup);
      
      // Track away team games
      if (!teamGameDays[matchup.awayTeam]) {
        teamGameDays[matchup.awayTeam] = {};
      }
      if (!teamGameDays[matchup.awayTeam][dateString]) {
        teamGameDays[matchup.awayTeam][dateString] = [];
      }
      teamGameDays[matchup.awayTeam][dateString].push(matchup);
    });
    
    // Check for multiple games on same day
    Object.entries(teamGameDays).forEach(([teamId, days]) => {
      Object.entries(days).forEach(([date, games]) => {
        if (games.length > 1) {
          violations.push({
            type: 'multiple-games-same-day',
            teamId,
            date,
            games: games.length,
            description: `Team ${teamId} has ${games.length} games scheduled on ${date}`
          });
        }
      });
    });
  });
  
  // Check home/away balance
  const homeAwayBalance = checkHomeAwayBalance(schedule);
  violations.push(...homeAwayBalance);
  
  // Check for consecutive games with minimal rest
  const consecutiveGameIssues = checkConsecutiveGames(schedule);
  violations.push(...consecutiveGameIssues);
  
  return {
    valid: violations.length === 0,
    violations
  };
};

/**
 * Check home/away balance for all teams
 * @param {Object} schedule - Schedule to check
 * @returns {Array} Balance issues
 */
function checkHomeAwayBalance(schedule) {
  const issues = [];
  const teamStats = {};
  
  // Initialize team stats
  schedule.weeks.forEach(week => {
    week.matchups.forEach(matchup => {
      // Initialize home team stats
      if (!teamStats[matchup.homeTeam]) {
        teamStats[matchup.homeTeam] = { home: 0, away: 0 };
      }
      
      // Initialize away team stats
      if (!teamStats[matchup.awayTeam]) {
        teamStats[matchup.awayTeam] = { home: 0, away: 0 };
      }
      
      // Count game
      teamStats[matchup.homeTeam].home++;
      teamStats[matchup.awayTeam].away++;
    });
  });
  
  // Check balance for each team
  Object.entries(teamStats).forEach(([teamId, stats]) => {
    const homeDiff = stats.home - stats.away;
    
    // Flag significant imbalance
    if (Math.abs(homeDiff) > 2) {
      issues.push({
        type: 'home-away-imbalance',
        teamId,
        homeGames: stats.home,
        awayGames: stats.away,
        difference: homeDiff,
        description: `Team ${teamId} has ${stats.home} home, ${stats.away} away games (${homeDiff > 0 ? '+' : ''}${homeDiff} home)`
      });
    }
  });
  
  return issues;
}

/**
 * Check for consecutive games with minimal rest
 * @param {Object} schedule - Schedule to check
 * @returns {Array} Consecutive game issues
 */
function checkConsecutiveGames(schedule) {
  const issues = [];
  
  // Create a map of all games by team and date
  const teamGames = {};
  
  // Initialize team games map
  schedule.weeks.forEach(week => {
    week.matchups.forEach(matchup => {
      // Add home team game
      if (!teamGames[matchup.homeTeam]) {
        teamGames[matchup.homeTeam] = [];
      }
      teamGames[matchup.homeTeam].push({
        date: matchup.date,
        opponent: matchup.awayTeam,
        isHome: true,
        matchup
      });
      
      // Add away team game
      if (!teamGames[matchup.awayTeam]) {
        teamGames[matchup.awayTeam] = [];
      }
      teamGames[matchup.awayTeam].push({
        date: matchup.date,
        opponent: matchup.homeTeam,
        isHome: false,
        matchup
      });
    });
  });
  
  // Sort each team's games by date
  Object.keys(teamGames).forEach(teamId => {
    teamGames[teamId].sort((a, b) => a.date - b.date);
  });
  
  // Check for consecutive games with minimal rest
  Object.entries(teamGames).forEach(([teamId, games]) => {
    for (let i = 0; i < games.length - 1; i++) {
      const currentGame = games[i];
      const nextGame = games[i + 1];
      
      // Calculate days between games
      const daysBetween = Math.round((nextGame.date - currentGame.date) / (24 * 60 * 60 * 1000));
      
      // Flag games with 0 days of rest (back-to-back)
      if (daysBetween === 0) {
        issues.push({
          type: 'back-to-back-games',
          teamId,
          dates: [currentGame.date.toDateString(), nextGame.date.toDateString()],
          description: `Team ${teamId} has back-to-back games on the same day`
        });
      }
      // Flag away games with 1 day of rest
      else if (daysBetween === 1 && !currentGame.isHome && !nextGame.isHome) {
        issues.push({
          type: 'consecutive-away-games-minimal-rest',
          teamId,
          dates: [currentGame.date.toDateString(), nextGame.date.toDateString()],
          description: `Team ${teamId} has consecutive away games with only 1 day rest`
        });
      }
    }
  });
  
  return issues;
} 