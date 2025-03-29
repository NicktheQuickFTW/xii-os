exports.up = function(knex) {
  return knex.schema
    // Players table
    .createTable('players', table => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('email').unique();
      table.string('phone');
      table.integer('ranking');
      table.jsonb('stats');
      table.timestamps(true, true);
    })
    
    // Venues table
    .createTable('venues', table => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('address');
      table.string('city');
      table.string('state');
      table.string('zip');
      table.integer('number_of_courts');
      table.jsonb('facilities');
      table.timestamps(true, true);
    })
    
    // Tournaments table
    .createTable('tournaments', table => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.date('start_date').notNullable();
      table.date('end_date').notNullable();
      table.integer('venue_id').references('id').inTable('venues');
      table.string('type');
      table.jsonb('details');
      table.timestamps(true, true);
    })
    
    // Tournament participants table
    .createTable('tournament_participants', table => {
      table.increments('id').primary();
      table.integer('tournament_id').references('id').inTable('tournaments');
      table.integer('player_id').references('id').inTable('players');
      table.string('seed');
      table.timestamps(true, true);
    })
    
    // Tennis matches table
    .createTable('tennis_matches', table => {
      table.increments('id').primary();
      table.integer('player1_id').references('id').inTable('players');
      table.integer('player2_id').references('id').inTable('players');
      table.date('match_date').notNullable();
      table.time('start_time');
      table.integer('venue_id').references('id').inTable('venues');
      table.integer('tournament_id').references('id').inTable('tournaments');
      table.string('score');
      table.string('status');
      table.jsonb('match_details');
      table.timestamps(true, true);
    })
    
    // Schedules table
    .createTable('schedules', table => {
      table.increments('id').primary();
      table.date('date').notNullable();
      table.time('start_time').notNullable();
      table.time('end_time');
      table.integer('venue_id').references('id').inTable('venues');
      table.integer('match_id').references('id').inTable('tennis_matches');
      table.string('event_type');
      table.jsonb('details');
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('schedules')
    .dropTableIfExists('tennis_matches')
    .dropTableIfExists('tournament_participants')
    .dropTableIfExists('tournaments')
    .dropTableIfExists('venues')
    .dropTableIfExists('players');
}; 