/**
 * NIL Valuation Routes
 */

const express = require('express');
const router = express.Router();
const nilValuationController = require('../controllers/nilValuationController');

// Routes for /api/transfer-portal/nil-valuations
router
  .route('/')
  .get(nilValuationController.getAllValuations)
  .post(nilValuationController.createValuation);

router
  .route('/:id')
  .get(nilValuationController.getValuation)
  .put(nilValuationController.updateValuation)
  .delete(nilValuationController.deleteValuation);

// Get NIL valuation by player ID
router.route('/player/:playerId').get(nilValuationController.getValuationByPlayer);

module.exports = router; 