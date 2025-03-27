/**
 * Transfer Portal & NIL Management Module
 * 
 * This module provides functionality for managing transfer portal data and NIL valuations
 * in compliance with ON3's Terms of Service, using manual data entry instead of scraping.
 */

const playerRoutes = require('./routes/players');
const nilValuationRoutes = require('./routes/nilValuations');

module.exports = {
  routes: {
    players: playerRoutes,
    nilValuations: nilValuationRoutes
  },
  models: {
    Player: require('./models/player'),
    NILValuation: require('./models/nilValuation')
  }
}; 