/**
 * Notion Integration Module
 * 
 * This module provides functionality for integrating with Notion workspaces,
 * allowing bidirectional data sync between XII-OS and Notion.
 */

const routes = require('./routes');
const NotionService = require('./services/notionService');

module.exports = {
  routes,
  models: {
    Notion: require('./models/notion')
  },
  services: {
    NotionService
  }
}; 