const express = require('express');
const router = express.Router();
const claudeController = require('./claudeController');

// Chat completion endpoint
router.post('/chat', claudeController.generateChatCompletion);

// Context protocol endpoints
router.post('/context', claudeController.storeContext);
router.get('/context/:id', claudeController.getContext);
router.put('/context/:id', claudeController.updateContext);
router.delete('/context/:id', claudeController.deleteContext);

module.exports = router; 