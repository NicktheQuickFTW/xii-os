/**
 * Seed file for MBB Transfer Portal Notion integration
 */

exports.seed = async function(knex) {
  // Delete existing entries first
  await knex('notion_integrations').where({ name: 'MBB Transfer Portal' }).del();
  
  // Insert the integration record
  await knex('notion_integrations').insert([
    {
      name: 'MBB Transfer Portal',
      token: process.env.NOTION_API_KEY || process.env.NOTION_TOKEN || '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',
      workspace_id: '1c279839c200801f',
      description: 'Men\'s Basketball Transfer Portal data in Notion',
      active: true,
      settings: JSON.stringify({
        default_database_id: '1c279839c200801f8b62f43c79e0afc9',
        target_tables: ['players', 'nil_valuations'],
      }),
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
  
  console.log('MBB Transfer Portal Notion integration seed completed');
}; 