/**
 * Migration: Create notion_integrations table
 */

exports.up = function(knex) {
  return knex.schema.createTable('notion_integrations', table => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.text('token').notNullable();
    table.string('workspace_id').notNullable().unique();
    table.text('description');
    table.boolean('active').defaultTo(true);
    table.jsonb('settings').defaultTo('{}');
    table.timestamp('last_sync').nullable();
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('notion_integrations');
}; 