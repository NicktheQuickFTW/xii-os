# Transfer Portal & NIL Management Module

This module provides functionality for managing transfer portal data and NIL valuations for the Big 12 Conference.

## Compliance Statement

This module is designed to comply with ON3's Terms of Service by:
- Using manual data entry rather than scraping
- Not using automated means to access ON3 data
- Not copying material from the ON3 website without permission

## Features

- Transfer portal player management
- NIL value estimation 
- Compliance monitoring

## Components

- **Player Management**: Track player transfer status
- **NIL Valuation**: Calculate estimated NIL values based on multiple factors
- **Data Entry System**: User-friendly interface for manual data entry

## API Endpoints

### Players
- `GET /api/transfer-portal/players` - Get all players
- `GET /api/transfer-portal/players/:id` - Get specific player
- `POST /api/transfer-portal/players` - Add new player
- `PUT /api/transfer-portal/players/:id` - Update player
- `DELETE /api/transfer-portal/players/:id` - Delete player

### NIL Valuations
- `GET /api/transfer-portal/nil-valuations` - Get all valuations
- `GET /api/transfer-portal/nil-valuations/:id` - Get specific valuation
- `GET /api/transfer-portal/nil-valuations/player/:playerId` - Get valuation by player
- `POST /api/transfer-portal/nil-valuations` - Add new valuation
- `PUT /api/transfer-portal/nil-valuations/:id` - Update valuation
- `DELETE /api/transfer-portal/nil-valuations/:id` - Delete valuation

## Integration Points

- Performance Analytics Module (for performance data)
- Athletic Competition Module (for roster impact assessment)

## Data Model

### Player
- Name, position, previous school
- Status (Entered, Committed, Withdrawn)
- Eligibility, height, weight, hometown
- NIL value estimate

### NIL Valuation
- Market value estimate
- Social media metrics
- Athletic performance factors
- Marketability assessment 