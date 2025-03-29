exports.seed = async function(knex) {
  // Clear existing data
  await knex('schedules').del();
  await knex('tennis_matches').del();
  await knex('tournament_participants').del();
  await knex('tournaments').del();
  await knex('venues').del();
  await knex('players').del();

  // Insert venues
  const venues = await knex('venues').insert([
    {
      name: 'Eastside Tennis Club',
      address: '123 Main Street',
      city: 'Portland',
      state: 'OR',
      zip: '97201',
      number_of_courts: 6,
      facilities: JSON.stringify({
        indoor: true,
        outdoor: true,
        clay: 2,
        hard: 4,
        locker_rooms: true,
        pro_shop: true
      })
    },
    {
      name: 'Westside Tennis Center',
      address: '456 Oak Avenue',
      city: 'Portland',
      state: 'OR',
      zip: '97209',
      number_of_courts: 8,
      facilities: JSON.stringify({
        indoor: true,
        outdoor: true,
        hard: 6,
        grass: 2,
        locker_rooms: true,
        cafe: true
      })
    },
    {
      name: 'Downtown Tennis Complex',
      address: '789 Park Boulevard',
      city: 'Portland',
      state: 'OR',
      zip: '97205',
      number_of_courts: 4,
      facilities: JSON.stringify({
        indoor: true,
        outdoor: false,
        hard: 4,
        locker_rooms: true
      })
    }
  ]).returning('id');

  // Insert players
  const players = await knex('players').insert([
    {
      name: 'John Smith',
      email: 'john@example.com',
      phone: '503-555-1234',
      ranking: 1,
      stats: JSON.stringify({
        wins: 32,
        losses: 5,
        tournaments_won: 3
      })
    },
    {
      name: 'Maria Garcia',
      email: 'maria@example.com',
      phone: '503-555-5678',
      ranking: 2,
      stats: JSON.stringify({
        wins: 28,
        losses: 7,
        tournaments_won: 2
      })
    },
    {
      name: 'Robert Johnson',
      email: 'robert@example.com',
      phone: '503-555-9012',
      ranking: 3,
      stats: JSON.stringify({
        wins: 25,
        losses: 10,
        tournaments_won: 1
      })
    },
    {
      name: 'Sarah Williams',
      email: 'sarah@example.com',
      phone: '503-555-3456',
      ranking: 4,
      stats: JSON.stringify({
        wins: 22,
        losses: 12,
        tournaments_won: 1
      })
    },
    {
      name: 'Michael Brown',
      email: 'michael@example.com',
      phone: '503-555-7890',
      ranking: 5,
      stats: JSON.stringify({
        wins: 18,
        losses: 15,
        tournaments_won: 0
      })
    },
    {
      name: 'Emily Davis',
      email: 'emily@example.com',
      phone: '503-555-2345',
      ranking: 6,
      stats: JSON.stringify({
        wins: 15,
        losses: 18,
        tournaments_won: 0
      })
    },
    {
      name: 'David Wilson',
      email: 'david@example.com',
      phone: '503-555-6789',
      ranking: 7,
      stats: JSON.stringify({
        wins: 12,
        losses: 20,
        tournaments_won: 0
      })
    },
    {
      name: 'Jessica Martinez',
      email: 'jessica@example.com',
      phone: '503-555-0123',
      ranking: 8,
      stats: JSON.stringify({
        wins: 10,
        losses: 22,
        tournaments_won: 0
      })
    }
  ]).returning('id');

  // Insert tournaments
  const tournaments = await knex('tournaments').insert([
    {
      name: 'Portland Spring Classic',
      start_date: '2024-04-15',
      end_date: '2024-04-21',
      venue_id: venues[0].id,
      type: 'open',
      details: JSON.stringify({
        prize_money: 5000,
        registration_deadline: '2024-04-01',
        surface: 'hard',
        format: 'single elimination'
      })
    },
    {
      name: 'Oregon State Championship',
      start_date: '2024-05-10',
      end_date: '2024-05-16',
      venue_id: venues[1].id,
      type: 'invitation',
      details: JSON.stringify({
        prize_money: 10000,
        registration_deadline: '2024-04-25',
        surface: 'grass',
        format: 'round robin'
      })
    },
    {
      name: 'Pacific Northwest Indoor Open',
      start_date: '2024-06-05',
      end_date: '2024-06-11',
      venue_id: venues[2].id,
      type: 'open',
      details: JSON.stringify({
        prize_money: 7500,
        registration_deadline: '2024-05-20',
        surface: 'hard',
        format: 'single elimination'
      })
    }
  ]).returning('id');

  // Insert tournament participants
  const tournamentParticipants = await knex('tournament_participants').insert([
    // Portland Spring Classic participants
    { tournament_id: tournaments[0].id, player_id: players[0].id, seed: '1' },
    { tournament_id: tournaments[0].id, player_id: players[1].id, seed: '2' },
    { tournament_id: tournaments[0].id, player_id: players[2].id, seed: '3' },
    { tournament_id: tournaments[0].id, player_id: players[3].id, seed: '4' },
    { tournament_id: tournaments[0].id, player_id: players[4].id, seed: '5' },
    { tournament_id: tournaments[0].id, player_id: players[5].id, seed: '6' },
    { tournament_id: tournaments[0].id, player_id: players[6].id, seed: '7' },
    { tournament_id: tournaments[0].id, player_id: players[7].id, seed: '8' },

    // Oregon State Championship participants
    { tournament_id: tournaments[1].id, player_id: players[0].id, seed: '1' },
    { tournament_id: tournaments[1].id, player_id: players[1].id, seed: '2' },
    { tournament_id: tournaments[1].id, player_id: players[2].id, seed: '3' },
    { tournament_id: tournaments[1].id, player_id: players[3].id, seed: '4' },

    // Pacific Northwest Indoor Open participants
    { tournament_id: tournaments[2].id, player_id: players[0].id, seed: '1' },
    { tournament_id: tournaments[2].id, player_id: players[1].id, seed: '2' },
    { tournament_id: tournaments[2].id, player_id: players[2].id, seed: '3' },
    { tournament_id: tournaments[2].id, player_id: players[3].id, seed: '4' },
    { tournament_id: tournaments[2].id, player_id: players[4].id, seed: '5' },
    { tournament_id: tournaments[2].id, player_id: players[5].id, seed: '6' }
  ]).returning('id');

  // Insert tennis matches
  const today = new Date();
  const matches = await knex('tennis_matches').insert([
    // Portland Spring Classic - Quarter Finals
    {
      player1_id: players[0].id,
      player2_id: players[7].id,
      match_date: '2024-04-17',
      start_time: '10:00:00',
      venue_id: venues[0].id,
      tournament_id: tournaments[0].id,
      score: '6-2, 6-3',
      status: 'completed',
      match_details: JSON.stringify({
        round: 'quarter-final',
        court: 'Center Court',
        duration: 95
      })
    },
    {
      player1_id: players[3].id,
      player2_id: players[4].id,
      match_date: '2024-04-17',
      start_time: '13:00:00',
      venue_id: venues[0].id,
      tournament_id: tournaments[0].id,
      score: '7-5, 4-6, 6-4',
      status: 'completed',
      match_details: JSON.stringify({
        round: 'quarter-final',
        court: 'Court 1',
        duration: 145
      })
    },
    {
      player1_id: players[1].id,
      player2_id: players[6].id,
      match_date: '2024-04-18',
      start_time: '10:00:00',
      venue_id: venues[0].id,
      tournament_id: tournaments[0].id,
      score: '6-4, 7-6',
      status: 'completed',
      match_details: JSON.stringify({
        round: 'quarter-final',
        court: 'Center Court',
        duration: 110
      })
    },
    {
      player1_id: players[2].id,
      player2_id: players[5].id,
      match_date: '2024-04-18',
      start_time: '13:00:00',
      venue_id: venues[0].id,
      tournament_id: tournaments[0].id,
      score: '6-3, 6-2',
      status: 'completed',
      match_details: JSON.stringify({
        round: 'quarter-final',
        court: 'Court 1',
        duration: 85
      })
    },

    // Portland Spring Classic - Semi Finals
    {
      player1_id: players[0].id,
      player2_id: players[3].id,
      match_date: '2024-04-19',
      start_time: '11:00:00',
      venue_id: venues[0].id,
      tournament_id: tournaments[0].id,
      score: '6-4, 6-3',
      status: 'completed',
      match_details: JSON.stringify({
        round: 'semi-final',
        court: 'Center Court',
        duration: 105
      })
    },
    {
      player1_id: players[1].id,
      player2_id: players[2].id,
      match_date: '2024-04-19',
      start_time: '14:00:00',
      venue_id: venues[0].id,
      tournament_id: tournaments[0].id,
      score: '3-6, 7-5, 6-2',
      status: 'completed',
      match_details: JSON.stringify({
        round: 'semi-final',
        court: 'Center Court',
        duration: 135
      })
    },

    // Portland Spring Classic - Final
    {
      player1_id: players[0].id,
      player2_id: players[1].id,
      match_date: '2024-04-21',
      start_time: '13:00:00',
      venue_id: venues[0].id,
      tournament_id: tournaments[0].id,
      score: '6-4, 3-6, 7-6',
      status: 'completed',
      match_details: JSON.stringify({
        round: 'final',
        court: 'Center Court',
        duration: 165,
        attendance: 450
      })
    },

    // Upcoming matches (not part of tournaments)
    {
      player1_id: players[0].id,
      player2_id: players[2].id,
      match_date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      start_time: '10:00:00',
      venue_id: venues[1].id,
      score: null,
      status: 'scheduled',
      match_details: JSON.stringify({
        round: 'friendly',
        court: 'Court 3'
      })
    },
    {
      player1_id: players[1].id,
      player2_id: players[3].id,
      match_date: new Date(today.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 8 days from now
      start_time: '14:00:00',
      venue_id: venues[2].id,
      score: null,
      status: 'scheduled',
      match_details: JSON.stringify({
        round: 'friendly',
        court: 'Court 2'
      })
    }
  ]).returning('id');

  // Insert schedules
  await knex('schedules').insert([
    // Portland Spring Classic schedules
    {
      date: '2024-04-17',
      start_time: '10:00:00',
      end_time: '12:00:00',
      venue_id: venues[0].id,
      match_id: matches[0].id,
      event_type: 'match',
      details: JSON.stringify({
        court: 'Center Court'
      })
    },
    {
      date: '2024-04-17',
      start_time: '13:00:00',
      end_time: '15:30:00',
      venue_id: venues[0].id,
      match_id: matches[1].id,
      event_type: 'match',
      details: JSON.stringify({
        court: 'Court 1'
      })
    },
    {
      date: '2024-04-18',
      start_time: '10:00:00',
      end_time: '12:00:00',
      venue_id: venues[0].id,
      match_id: matches[2].id,
      event_type: 'match',
      details: JSON.stringify({
        court: 'Center Court'
      })
    },
    {
      date: '2024-04-18',
      start_time: '13:00:00',
      end_time: '15:00:00',
      venue_id: venues[0].id,
      match_id: matches[3].id,
      event_type: 'match',
      details: JSON.stringify({
        court: 'Court 1'
      })
    },
    {
      date: '2024-04-19',
      start_time: '11:00:00',
      end_time: '13:00:00',
      venue_id: venues[0].id,
      match_id: matches[4].id,
      event_type: 'match',
      details: JSON.stringify({
        court: 'Center Court'
      })
    },
    {
      date: '2024-04-19',
      start_time: '14:00:00',
      end_time: '16:30:00',
      venue_id: venues[0].id,
      match_id: matches[5].id,
      event_type: 'match',
      details: JSON.stringify({
        court: 'Center Court'
      })
    },
    {
      date: '2024-04-21',
      start_time: '13:00:00',
      end_time: '16:00:00',
      venue_id: venues[0].id,
      match_id: matches[6].id,
      event_type: 'match',
      details: JSON.stringify({
        court: 'Center Court',
        special_event: 'Tournament Final'
      })
    },

    // Future matches schedules
    {
      date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      start_time: '10:00:00',
      end_time: '12:00:00',
      venue_id: venues[1].id,
      match_id: matches[7].id,
      event_type: 'match',
      details: JSON.stringify({
        court: 'Court 3'
      })
    },
    {
      date: new Date(today.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      start_time: '14:00:00',
      end_time: '16:00:00',
      venue_id: venues[2].id,
      match_id: matches[8].id,
      event_type: 'match',
      details: JSON.stringify({
        court: 'Court 2'
      })
    },

    // Practice sessions
    {
      date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      start_time: '09:00:00',
      end_time: '11:00:00',
      venue_id: venues[0].id,
      event_type: 'practice',
      details: JSON.stringify({
        court: 'Court 4',
        player_id: players[0].id,
        partner_id: players[4].id
      })
    },
    {
      date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      start_time: '15:00:00',
      end_time: '17:00:00',
      venue_id: venues[2].id,
      event_type: 'practice',
      details: JSON.stringify({
        court: 'Court 1',
        player_id: players[1].id,
        partner_id: players[5].id
      })
    }
  ]);
}; 