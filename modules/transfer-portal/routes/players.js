/**
 * Transfer Portal Player Routes
 */

const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');

// Routes for /api/transfer-portal/players
router
  .route('/')
  .get(playerController.getAllPlayers)
  .post(playerController.createPlayer);

router
  .route('/:id')
  .get(playerController.getPlayer)
  .put(playerController.updatePlayer)
  .delete(playerController.deletePlayer);

module.exports = router; 