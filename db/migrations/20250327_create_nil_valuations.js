/**
 * Migration: Create nil_valuations table
 */

exports.up = function(knex) {
  return knex.schema.createTable('nil_valuations', table => {
    table.increments('id').primary();
    table.integer('player_id').unsigned().notNullable();
    table.foreign('player_id').references('players.id').onDelete('CASCADE');
    table.decimal('market_value_estimate');
    
    // Social Media Metrics
    table.integer('twitter_followers').defaultTo(0);
    table.decimal('twitter_engagement').defaultTo(0);
    table.integer('instagram_followers').defaultTo(0);
    table.decimal('instagram_engagement').defaultTo(0);
    table.integer('tiktok_followers').defaultTo(0);
    table.decimal('tiktok_engagement').defaultTo(0);
    
    // Athletic Performance
    table.decimal('athletic_performance_rating');
    table.text('key_stats');
    
    // Marketability
    table.decimal('marketability_score');
    table.text('marketability_notes');
    
    table.date('valuation_date').defaultTo(knex.fn.now());
    table.string('valuation_method').notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('nil_valuations');
}; 