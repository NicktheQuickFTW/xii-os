const db = require('../config/database');

// Tennis Match Queries
const tennisQueries = {
  // Get all tennis matches
  getAllMatches: () => {
    return db('tennis_matches')
      .select('*')
      .orderBy('match_date', 'desc');
  },

  // Get matches by date range
  getMatchesByDateRange: (startDate, endDate) => {
    return db('tennis_matches')
      .select('*')
      .whereBetween('match_date', [startDate, endDate])
      .orderBy('match_date', 'asc');
  },

  // Get matches by player
  getMatchesByPlayer: (playerId) => {
    return db('tennis_matches')
      .select('*')
      .where('player1_id', playerId)
      .orWhere('player2_id', playerId)
      .orderBy('match_date', 'desc');
  },

  // Create new match
  createMatch: (matchData) => {
    return db('tennis_matches')
      .insert(matchData)
      .returning('*');
  },

  // Update match result
  updateMatchResult: (matchId, resultData) => {
    return db('tennis_matches')
      .where('id', matchId)
      .update(resultData)
      .returning('*');
  }
};

// Player Queries
const playerQueries = {
  // Get all players
  getAllPlayers: () => {
    return db('players')
      .select('*')
      .orderBy('name');
  },

  // Get player by ID
  getPlayerById: (playerId) => {
    return db('players')
      .select('*')
      .where('id', playerId)
      .first();
  },

  // Create new player
  createPlayer: (playerData) => {
    return db('players')
      .insert(playerData)
      .returning('*');
  },

  // Update player stats
  updatePlayerStats: (playerId, statsData) => {
    return db('players')
      .where('id', playerId)
      .update(statsData)
      .returning('*');
  }
};

// Schedule Queries
const scheduleQueries = {
  // Get schedule for a specific date
  getScheduleByDate: (date) => {
    return db('schedules')
      .select('*')
      .where('date', date)
      .orderBy('start_time');
  },

  // Get schedule for a date range
  getScheduleByDateRange: (startDate, endDate) => {
    return db('schedules')
      .select('*')
      .whereBetween('date', [startDate, endDate])
      .orderBy('date', 'start_time');
  },

  // Create schedule entry
  createScheduleEntry: (scheduleData) => {
    return db('schedules')
      .insert(scheduleData)
      .returning('*');
  },

  // Update schedule entry
  updateScheduleEntry: (scheduleId, updateData) => {
    return db('schedules')
      .where('id', scheduleId)
      .update(updateData)
      .returning('*');
  }
};

// Venue Queries
const venueQueries = {
  // Get all venues
  getAllVenues: () => {
    return db('venues')
      .select('*')
      .orderBy('name');
  },

  // Get venue by ID
  getVenueById: (venueId) => {
    return db('venues')
      .select('*')
      .where('id', venueId)
      .first();
  },

  // Get venue availability
  getVenueAvailability: (venueId, date) => {
    return db('schedules')
      .select('*')
      .where('venue_id', venueId)
      .where('date', date)
      .orderBy('start_time');
  }
};

// Tournament Queries
const tournamentQueries = {
  // Get all tournaments
  getAllTournaments: () => {
    return db('tournaments')
      .select('*')
      .orderBy('start_date', 'desc');
  },

  // Get tournament by ID
  getTournamentById: (tournamentId) => {
    return db('tournaments')
      .select('*')
      .where('id', tournamentId)
      .first();
  },

  // Get tournament participants
  getTournamentParticipants: (tournamentId) => {
    return db('tournament_participants')
      .select('players.*')
      .join('players', 'tournament_participants.player_id', 'players.id')
      .where('tournament_id', tournamentId)
      .orderBy('players.name');
  }
};

module.exports = {
  tennisQueries,
  playerQueries,
  scheduleQueries,
  venueQueries,
  tournamentQueries
}; 