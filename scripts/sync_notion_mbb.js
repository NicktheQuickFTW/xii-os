/**
 * Notion MBB Transfer Portal Sync Script
 * 
 * This script makes it easy to sync data between XII-OS and Notion for MBB transfer portal.
 * Run it with: node scripts/sync_notion_mbb.js [direction]
 * Where [direction] is either "to-notion" or "from-notion" (default: from-notion)
 */

const axios = require('axios');
const knex = require('../db/knex');

// Configuration
const MBB_INTEGRATION_NAME = 'MBB Transfer Portal';
const API_BASE_URL = 'http://localhost:8080/api'; // Using the Gateway
const TARGET_TABLE = 'players';
const FILTERS = { sport: 'basketball' };

async function main() {
  // Start a transaction to ensure proper connection management
  const trx = await knex.transaction();
  
  try {
    console.log('Starting MBB Transfer Portal Notion sync...');
    
    // Determine sync direction from command line args
    const direction = process.argv[2] || 'from-notion';
    if (!['to-notion', 'from-notion'].includes(direction)) {
      console.error('Invalid direction. Use "to-notion" or "from-notion"');
      await trx.rollback();
      process.exit(1);
    }
    
    // 1. Get the integration details from database
    const integration = await trx('notion_integrations')
      .where({ name: MBB_INTEGRATION_NAME })
      .first();
      
    if (!integration) {
      console.error(`Integration "${MBB_INTEGRATION_NAME}" not found in database.`);
      console.log('Please run the seed file first: npx knex seed:run --specific=notion_mbb_integration.js');
      await trx.rollback();
      process.exit(1);
    }
    
    // 2. Get the database ID from settings
    const settings = typeof integration.settings === 'string' 
      ? JSON.parse(integration.settings) 
      : integration.settings;
      
    const databaseId = settings.default_database_id;
    
    if (!databaseId) {
      console.error('No database ID found in integration settings');
      await trx.rollback();
      process.exit(1);
    }
    
    // 3. Perform the sync operation based on direction
    if (direction === 'from-notion') {
      console.log(`Syncing data FROM Notion database ${databaseId} TO XII-OS table ${TARGET_TABLE}...`);
      
      try {
        const response = await axios.post(
          `${API_BASE_URL}/notion/integrations/${integration.id}/databases/${databaseId}/sync-from-notion`,
          { target_table: TARGET_TABLE }
        );
        
        console.log(`Sync completed successfully! ${response.data.count} records synced.`);
      } catch (apiError) {
        console.error('API Error:', apiError.message);
        if (apiError.response) {
          console.error('API Response:', apiError.response.data);
        }
        await trx.rollback();
        process.exit(1);
      }
    } else {
      console.log(`Syncing data FROM XII-OS table ${TARGET_TABLE} TO Notion database ${databaseId}...`);
      
      try {
        const response = await axios.post(
          `${API_BASE_URL}/notion/integrations/${integration.id}/databases/${databaseId}/sync-to-notion`,
          { 
            source_table: TARGET_TABLE,
            filters: FILTERS
          }
        );
        
        console.log(`Sync completed successfully! ${response.data.count} records synced.`);
      } catch (apiError) {
        console.error('API Error:', apiError.message);
        if (apiError.response) {
          console.error('API Response:', apiError.response.data);
        }
        await trx.rollback();
        process.exit(1);
      }
    }
    
    // Update the last_sync timestamp
    await trx('notion_integrations')
      .where({ id: integration.id })
      .update({ 
        last_sync: new Date(),
        updated_at: new Date()
      });
      
    // Commit the transaction
    await trx.commit();
    console.log('Sync operation complete!');
  } catch (error) {
    // Rollback the transaction on error
    await trx.rollback();
    
    console.error('Error during sync operation:');
    console.error(error.message);
    process.exit(1);
  } finally {
    // Explicitly destroy knex connection pool
    await knex.destroy();
  }
}

// Run the script
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 