/**
 * Transfer Portal Player Model
 * 
 * This model represents transfer portal players and their associated data.
 * Data is designed to be manually entered rather than scraped to comply with
 * ON3's Terms of Service.
 */

const knex = require('../../../db/knex');

const TABLE_NAME = 'players';

/**
 * Find all players
 * @returns {Promise<Array>} Array of player objects
 */
function findAll() {
  return knex(TABLE_NAME).select('*');
}

/**
 * Find player by ID
 * @param {number} id - Player ID
 * @returns {Promise<Object>} Player object
 */
function findById(id) {
  return knex(TABLE_NAME).where({ id }).first();
}

/**
 * Create a new player
 * @param {Object} player - Player data
 * @returns {Promise<Array>} Array containing the ID of the new player
 */
function create(player) {
  return knex(TABLE_NAME).insert(player).returning('*');
}

/**
 * Update a player
 * @param {number} id - Player ID
 * @param {Object} player - Updated player data
 * @returns {Promise<number>} Number of rows updated
 */
function update(id, player) {
  return knex(TABLE_NAME).where({ id }).update(player).returning('*');
}

/**
 * Delete a player
 * @param {number} id - Player ID
 * @returns {Promise<number>} Number of rows deleted
 */
function remove(id) {
  return knex(TABLE_NAME).where({ id }).del();
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove
}; 