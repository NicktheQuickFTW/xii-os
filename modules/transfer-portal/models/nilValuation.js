/**
 * NIL Valuation Model
 * 
 * This model represents NIL (Name, Image, Likeness) valuation data for athletes.
 * Valuations are calculated internally rather than scraping data.
 */

const knex = require('../../../db/knex');

const TABLE_NAME = 'nil_valuations';

/**
 * Find all valuations and join with player data
 * @returns {Promise<Array>} Array of valuation objects with player data
 */
function findAll() {
  return knex(TABLE_NAME)
    .join('players', 'nil_valuations.player_id', '=', 'players.id')
    .select(
      'nil_valuations.*',
      'players.name as player_name',
      'players.position as player_position'
    );
}

/**
 * Find valuation by ID and join with player data
 * @param {number} id - Valuation ID
 * @returns {Promise<Object>} Valuation object with player data
 */
function findById(id) {
  return knex(TABLE_NAME)
    .join('players', 'nil_valuations.player_id', '=', 'players.id')
    .select(
      'nil_valuations.*',
      'players.name as player_name',
      'players.position as player_position'
    )
    .where('nil_valuations.id', id)
    .first();
}

/**
 * Find valuation by player ID
 * @param {number} playerId - Player ID
 * @returns {Promise<Object>} Valuation object with player data
 */
function findByPlayerId(playerId) {
  return knex(TABLE_NAME)
    .join('players', 'nil_valuations.player_id', '=', 'players.id')
    .select(
      'nil_valuations.*',
      'players.name as player_name',
      'players.position as player_position'
    )
    .where('nil_valuations.player_id', playerId)
    .first();
}

/**
 * Create a new valuation
 * @param {Object} valuation - Valuation data
 * @returns {Promise<Array>} Array containing the ID of the new valuation
 */
function create(valuation) {
  return knex(TABLE_NAME).insert(valuation).returning('*');
}

/**
 * Update a valuation
 * @param {number} id - Valuation ID
 * @param {Object} valuation - Updated valuation data
 * @returns {Promise<number>} Number of rows updated
 */
function update(id, valuation) {
  return knex(TABLE_NAME).where({ id }).update(valuation).returning('*');
}

/**
 * Delete a valuation
 * @param {number} id - Valuation ID
 * @returns {Promise<number>} Number of rows deleted
 */
function remove(id) {
  return knex(TABLE_NAME).where({ id }).del();
}

module.exports = {
  findAll,
  findById,
  findByPlayerId,
  create,
  update,
  remove
}; 