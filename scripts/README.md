# XII-OS Utility Scripts

This directory contains utility scripts for common operations in the XII-OS system.

## Available Scripts

### Notion MBB Transfer Portal Sync

Syncs data between XII-OS and the MBB Transfer Portal Notion database.

```bash
# Sync FROM Notion TO XII-OS (default)
node scripts/sync_notion_mbb.js

# Sync FROM XII-OS TO Notion
node scripts/sync_notion_mbb.js to-notion
```

Before running this script:
1. Ensure your Notion integration token is set in the environment: `export NOTION_TOKEN=your_token_here`
2. Run the seed file to create the integration record: `npx knex seed:run --specific=notion_mbb_integration.js`
3. Make sure all XII-OS services are running, especially the MCP and Gateway servers

### Other Scripts

Additional utility scripts will be added here as needed. 