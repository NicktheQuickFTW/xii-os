/**
 * Create database tables for FlexTime scheduling system
 */
exports.up = function(knex) {
  return knex.schema
    // Schedules table - stores schedule metadata
    .createTable('schedules', function(table) {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('sport').notNullable();
      table.date('season_start').notNullable();
      table.date('season_end').notNullable();
      table.string('format').notNullable();
      table.jsonb('metadata'); // For storing metrics and other data
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at');
    })
    
    // Schedule matchups table - stores individual games
    .createTable('schedule_matchups', function(table) {
      table.increments('id').primary();
      table.integer('schedule_id').notNullable()
           .references('id').inTable('schedules').onDelete('CASCADE');
      table.string('home_team').notNullable();
      table.string('away_team').notNullable();
      table.integer('week').notNullable();
      table.date('game_date').notNullable();
      table.string('type').defaultTo('conference');
      table.string('series_id'); // For baseball/softball series
      table.integer('series_game'); // Game number in series
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      // Indexes for faster queries
      table.index('schedule_id');
      table.index(['schedule_id', 'week']);
      table.index(['home_team', 'away_team']);
    })
    
    // Configuration table - stores scheduling configurations
    .createTable('schedule_configurations', function(table) {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('sport').notNullable();
      table.date('season_start').notNullable();
      table.date('season_end').notNullable();
      table.date('championship_date');
      table.string('competition_format');
      table.integer('games_per_team');
      table.jsonb('configuration_data'); // Store full configuration
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at');
    })
    
    // Teams in configuration
    .createTable('config_teams', function(table) {
      table.increments('id').primary();
      table.integer('config_id').notNullable()
           .references('id').inTable('schedule_configurations').onDelete('CASCADE');
      table.string('team_id').notNullable();
      table.string('name').notNullable();
      table.string('location');
      table.float('lat');
      table.float('lng');
      table.string('venue');
      table.string('conference');
      table.string('division');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      // Indexes
      table.index('config_id');
      table.unique(['config_id', 'team_id']);
    })
    
    // Constraints in configuration
    .createTable('config_constraints', function(table) {
      table.increments('id').primary();
      table.integer('config_id').notNullable()
           .references('id').inTable('schedule_configurations').onDelete('CASCADE');
      table.string('team_id').notNullable();
      table.string('type').notNullable();
      table.string('description');
      table.integer('day_of_week'); // For no-play-day-of-week
      table.date('start_date'); // For no-play-date-range
      table.date('end_date'); // For no-play-date-range
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      // Indexes
      table.index('config_id');
      table.index(['config_id', 'team_id']);
    })
    
    // Schedule optimization jobs
    .createTable('schedule_jobs', function(table) {
      table.increments('id').primary();
      table.string('job_type').notNullable();
      table.integer('source_schedule_id').references('id').inTable('schedules');
      table.integer('output_schedule_id').references('id').inTable('schedules');
      table.jsonb('parameters');
      table.string('status').defaultTo('pending');
      table.text('result');
      table.timestamp('started_at');
      table.timestamp('completed_at');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      // Indexes
      table.index('job_type');
      table.index('status');
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('schedule_jobs')
    .dropTableIfExists('config_constraints')
    .dropTableIfExists('config_teams')
    .dropTableIfExists('schedule_configurations')
    .dropTableIfExists('schedule_matchups')
    .dropTableIfExists('schedules');
}; 