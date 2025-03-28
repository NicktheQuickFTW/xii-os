# FlexTime

FlexTime is a comprehensive solution for generating and optimizing athletic competition schedules for the Big 12 Conference. This system leverages cloud database storage and Claude AI to create optimized schedules that balance multiple competing factors.

## Key Features

- **Multi-sport support**: Configurable for basketball, football, baseball, and other sports
- **Customizable constraints**: Institutional policies (e.g., BYU's no-Sunday play), academic calendars, venue conflicts
- **Advanced optimization**: Balance travel efficiency, competitive equity, TV revenue, and student-athlete wellbeing
- **Claude AI integration**: Get intelligent suggestions for optimization parameters and schedule analysis
- **Database storage**: Save and retrieve configurations and schedules from PostgreSQL database
- **MCP integration**: Connect to the Mission Control Panel for progress monitoring and control

## System Architecture

The system consists of several core modules:

1. **Configuration**: Setup of sport, teams, and constraints
2. **Base Schedule Creation**: Generation of initial schedule using sport-specific rules
3. **Constraints Application**: Implementation of institutional, venue, and academic constraints
4. **Multi-Factor Optimization**: Simulated annealing with weighted factors
5. **Analysis**: Comprehensive metrics package with team-by-team schedules
6. **Database Adapter**: PostgreSQL integration for storage and retrieval
7. **Claude AI Adapter**: Integration with Claude for schedule analysis and optimization
8. **MCP Adapter**: Connection to Mission Control Panel

## API Endpoints

The system exposes the following API endpoints:

- `POST /api/athletic-competition/flextime` - Generate a new schedule
- `GET /api/athletic-competition/flextime` - List all schedules
- `GET /api/athletic-competition/flextime/:scheduleId` - Get a specific schedule
- `POST /api/athletic-competition/flextime/validate` - Validate a schedule
- `POST /api/athletic-competition/flextime/optimize` - Optimize an existing schedule
- `POST /api/athletic-competition/flextime/analyze` - Analyze a schedule with Claude AI
- `POST /api/athletic-competition/flextime/save` - Save a schedule to the database
- `POST /api/athletic-competition/configurations` - Save a configuration
- `GET /api/athletic-competition/configurations` - List all configurations
- `GET /api/athletic-competition/configurations/:configId` - Get a specific configuration

## Database Schema

The system uses the following database tables:

- `flextime_schedules` - Main schedule information
- `flextime_matchups` - Individual games from schedules
- `flextime_configurations` - Stored configurations
- `flextime_teams` - Teams in configurations
- `flextime_constraints` - Constraints in configurations
- `flextime_jobs` - Background jobs for processing

## Running the System

To run the system:

1. Ensure PostgreSQL database is configured
2. Run the database migrations: `npx knex migrate:latest`
3. Use the CLI tool for quick scheduling: `node scripts/run-flextime.js basketball generate`
4. Or use the API endpoints for integration with other systems

## Optimization Factors

The system balances multiple competing factors:

- **Travel Efficiency**: Minimize travel distances and back-to-back road games
- **Competitive Balance**: Ensure fair distribution of games and protected rivalries
- **TV Revenue Potential**: Schedule high-profile games in premium broadcast windows
- **Student-Athlete Wellbeing**: Account for academic schedules and adequate rest periods

## Command Line Interface

A command-line tool is provided at `scripts/run-flextime.js` for easy access:

```
node scripts/run-flextime.js [sport] [action] [outputPath]
```

Available sports: basketball, football
Available actions: generate, analyze, optimize 