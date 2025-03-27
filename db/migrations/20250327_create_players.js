/**
 * Migration: Create players table
 */

exports.up = function(knex) {
  return knex.schema.createTable('players', table => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('position').notNullable();
    table.string('previous_school').notNullable();
    table.string('eligibility').notNullable();
    table.string('height');
    table.string('weight');
    table.string('hometown');
    table.enu('status', ['Entered', 'Committed', 'Withdrawn']).notNullable();
    table.date('entered_date');
    table.decimal('nil_value');
    table.text('notes');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('players');
}; 