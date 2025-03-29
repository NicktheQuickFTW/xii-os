const db = require('../config/database');

// Advanced Transaction Queries
const transactionQueries = {
  // Create match with schedule in a single transaction
  createMatchWithSchedule: async (matchData, scheduleData) => {
    return db.transaction(async trx => {
      // Insert match
      const [match] = await trx('tennis_matches')
        .insert(matchData)
        .returning('*');
      
      // Add match ID to schedule data
      scheduleData.match_id = match.id;
      
      // Insert schedule
      const [schedule] = await trx('schedules')
        .insert(scheduleData)
        .returning('*');
      
      return { match, schedule };
    });
  },
  
  // Register player for tournament with single transaction
  registerPlayerForTournament: async (playerId, tournamentId, seedInfo) => {
    return db.transaction(async trx => {
      // Check if player exists
      const player = await trx('players')
        .where('id', playerId)
        .first();
      
      if (!player) {
        throw new Error('Player not found');
      }
      
      // Check if tournament exists
      const tournament = await trx('tournaments')
        .where('id', tournamentId)
        .first();
      
      if (!tournament) {
        throw new Error('Tournament not found');
      }
      
      // Register player for tournament
      const [registration] = await trx('tournament_participants')
        .insert({
          player_id: playerId,
          tournament_id: tournamentId,
          seed: seedInfo || null
        })
        .returning('*');
      
      return registration;
    });
  }
};

// Advanced Analytics Queries
const analyticsQueries = {
  // Get player performance stats
  getPlayerPerformanceStats: async (playerId) => {
    // Get matches played
    const matches = await db('tennis_matches')
      .where('player1_id', playerId)
      .orWhere('player2_id', playerId);
    
    let wins = 0;
    let losses = 0;
    let totalGamesWon = 0;
    let totalGamesLost = 0;
    
    // Calculate stats
    matches.forEach(match => {
      if (!match.score) return; // Skip matches without scores
      
      const isPlayer1 = match.player1_id === playerId;
      const sets = match.score.split(',');
      let playerSetsWon = 0;
      let opponentSetsWon = 0;
      
      sets.forEach(set => {
        const [p1Score, p2Score] = set.trim().split('-').map(Number);
        
        if (isPlayer1) {
          totalGamesWon += p1Score;
          totalGamesLost += p2Score;
          if (p1Score > p2Score) playerSetsWon++;
          else opponentSetsWon++;
        } else {
          totalGamesWon += p2Score;
          totalGamesLost += p1Score;
          if (p2Score > p1Score) playerSetsWon++;
          else opponentSetsWon++;
        }
      });
      
      if (playerSetsWon > opponentSetsWon) wins++;
      else losses++;
    });
    
    return {
      playerId,
      matches: matches.length,
      wins,
      losses,
      winRate: matches.length ? (wins / matches.length).toFixed(2) : 0,
      totalGamesWon,
      totalGamesLost
    };
  },
  
  // Get tournament statistics
  getTournamentStatistics: async (tournamentId) => {
    const matches = await db('tennis_matches')
      .where('tournament_id', tournamentId)
      .orderBy('match_date', 'asc');
    
    const playerIds = new Set();
    matches.forEach(match => {
      playerIds.add(match.player1_id);
      playerIds.add(match.player2_id);
    });
    
    const completedMatches = matches.filter(m => m.status === 'completed').length;
    
    return {
      tournamentId,
      totalMatches: matches.length,
      completedMatches,
      completionRate: matches.length ? (completedMatches / matches.length).toFixed(2) : 0,
      totalPlayers: playerIds.size,
      averageMatchesPerPlayer: playerIds.size ? (matches.length / playerIds.size).toFixed(2) : 0
    };
  }
};

// Search Queries
const searchQueries = {
  // Search players by name
  searchPlayers: (searchTerm) => {
    return db('players')
      .select('*')
      .whereRaw('LOWER(name) LIKE ?', [`%${searchTerm.toLowerCase()}%`])
      .orderBy('name');
  },
  
  // Search venues by name or location
  searchVenues: (searchTerm) => {
    return db('venues')
      .select('*')
      .where(builder => {
        builder.whereRaw('LOWER(name) LIKE ?', [`%${searchTerm.toLowerCase()}%`])
          .orWhereRaw('LOWER(address) LIKE ?', [`%${searchTerm.toLowerCase()}%`])
          .orWhereRaw('LOWER(city) LIKE ?', [`%${searchTerm.toLowerCase()}%`])
          .orWhereRaw('LOWER(state) LIKE ?', [`%${searchTerm.toLowerCase()}%`]);
      })
      .orderBy('name');
  },
  
  // Search tournaments by name or date range
  searchTournaments: (searchTerm, startDate, endDate) => {
    const query = db('tournaments').select('*');
    
    if (searchTerm) {
      query.whereRaw('LOWER(name) LIKE ?', [`%${searchTerm.toLowerCase()}%`]);
    }
    
    if (startDate && endDate) {
      query.where(builder => {
        builder.whereBetween('start_date', [startDate, endDate])
          .orWhereBetween('end_date', [startDate, endDate]);
      });
    }
    
    return query.orderBy('start_date', 'desc');
  }
};

// Optimization Queries
const optimizationQueries = {
  // Get all venues with court count and availability for a date
  getVenuesWithAvailability: async (date) => {
    // Get all venues
    const venues = await db('venues').select('*');
    
    // For each venue, get scheduled events for that date
    const venuesWithAvailability = await Promise.all(
      venues.map(async (venue) => {
        const schedules = await db('schedules')
          .where('venue_id', venue.id)
          .where('date', date)
          .orderBy('start_time');
        
        // Calculate available time slots
        const availableTimeSlots = [];
        let previousEndTime = '08:00:00'; // Start of day
        const endOfDay = '22:00:00'; // End of day
        
        schedules.forEach(schedule => {
          if (schedule.start_time > previousEndTime) {
            availableTimeSlots.push({
              start: previousEndTime,
              end: schedule.start_time
            });
          }
          previousEndTime = schedule.end_time;
        });
        
        // Add final slot if needed
        if (previousEndTime < endOfDay) {
          availableTimeSlots.push({
            start: previousEndTime,
            end: endOfDay
          });
        }
        
        return {
          ...venue,
          scheduledCount: schedules.length,
          availableTimeSlots
        };
      })
    );
    
    return venuesWithAvailability;
  },
  
  // Get upcoming matches with player details in a single query
  getUpcomingMatchesWithDetails: (limit = 10) => {
    return db('tennis_matches')
      .select(
        'tennis_matches.*',
        'p1.name as player1_name',
        'p2.name as player2_name',
        'v.name as venue_name',
        'v.address as venue_address',
        't.name as tournament_name'
      )
      .join('players as p1', 'tennis_matches.player1_id', 'p1.id')
      .join('players as p2', 'tennis_matches.player2_id', 'p2.id')
      .leftJoin('venues as v', 'tennis_matches.venue_id', 'v.id')
      .leftJoin('tournaments as t', 'tennis_matches.tournament_id', 't.id')
      .where('match_date', '>=', db.raw('CURRENT_DATE'))
      .where('status', '!=', 'completed')
      .orderBy('match_date', 'asc')
      .orderBy('start_time', 'asc')
      .limit(limit);
  },
  
  // Get player schedule with all details in a single query
  getPlayerSchedule: (playerId, startDate, endDate) => {
    return db('tennis_matches')
      .select(
        'tennis_matches.*',
        'p1.name as player1_name',
        'p2.name as player2_name',
        'v.name as venue_name',
        'v.address as venue_address',
        't.name as tournament_name'
      )
      .join('players as p1', 'tennis_matches.player1_id', 'p1.id')
      .join('players as p2', 'tennis_matches.player2_id', 'p2.id')
      .leftJoin('venues as v', 'tennis_matches.venue_id', 'v.id')
      .leftJoin('tournaments as t', 'tennis_matches.tournament_id', 't.id')
      .where(function() {
        this.where('player1_id', playerId).orWhere('player2_id', playerId);
      })
      .whereBetween('match_date', [startDate, endDate])
      .orderBy('match_date', 'asc')
      .orderBy('start_time', 'asc');
  }
};

// Reporting Queries
const reportingQueries = {
  // Get tournament bracket data
  getTournamentBracket: (tournamentId) => {
    return db('tennis_matches')
      .select(
        'tennis_matches.*',
        'p1.name as player1_name',
        'p2.name as player2_name',
        'tp1.seed as player1_seed',
        'tp2.seed as player2_seed'
      )
      .join('players as p1', 'tennis_matches.player1_id', 'p1.id')
      .join('players as p2', 'tennis_matches.player2_id', 'p2.id')
      .leftJoin('tournament_participants as tp1', function() {
        this.on('tp1.player_id', '=', 'tennis_matches.player1_id')
            .andOn('tp1.tournament_id', '=', 'tennis_matches.tournament_id');
      })
      .leftJoin('tournament_participants as tp2', function() {
        this.on('tp2.player_id', '=', 'tennis_matches.player2_id')
            .andOn('tp2.tournament_id', '=', 'tennis_matches.tournament_id');
      })
      .where('tennis_matches.tournament_id', tournamentId)
      .orderBy('match_date', 'asc')
      .orderBy('start_time', 'asc');
  },
  
  // Get monthly venue utilization
  getMonthlyVenueUtilization: (venueId, year, month) => {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month
    
    return db('schedules')
      .select(
        db.raw('DATE(date) as day'),
        db.raw('COUNT(*) as event_count'),
        db.raw('SUM(EXTRACT(EPOCH FROM (end_time - start_time)))/3600 as total_hours')
      )
      .where('venue_id', venueId)
      .whereBetween('date', [startDate, endDate])
      .groupBy('day')
      .orderBy('day');
  },
  
  // Get player ranking based on wins and losses
  getPlayerRankings: () => {
    return db.raw(`
      WITH player_results AS (
        SELECT 
          p.id, 
          p.name,
          COUNT(CASE 
                  WHEN (m.player1_id = p.id AND m.score LIKE '%>%') OR 
                       (m.player2_id = p.id AND m.score LIKE '%<%') 
                  THEN 1 
                END) as wins,
          COUNT(CASE 
                  WHEN (m.player1_id = p.id AND m.score LIKE '%<%') OR 
                       (m.player2_id = p.id AND m.score LIKE '%>%') 
                  THEN 1 
                END) as losses,
          COUNT(m.id) as total_matches
        FROM players p
        LEFT JOIN tennis_matches m ON p.id = m.player1_id OR p.id = m.player2_id
        WHERE m.status = 'completed'
        GROUP BY p.id, p.name
      )
      SELECT 
        id,
        name,
        wins,
        losses,
        total_matches,
        CASE 
          WHEN total_matches > 0 THEN (wins::float / total_matches)
          ELSE 0 
        END as win_rate,
        RANK() OVER (ORDER BY wins DESC, (CASE WHEN total_matches > 0 THEN (wins::float / total_matches) ELSE 0 END) DESC) as ranking
      FROM player_results
      ORDER BY ranking ASC
    `);
  }
};

module.exports = {
  transactionQueries,
  analyticsQueries,
  searchQueries,
  optimizationQueries,
  reportingQueries
}; 