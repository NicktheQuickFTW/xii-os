# Big 12 Tennis Tiebreaker App

A web application for managing and calculating Big 12 tennis match results and tournament seedings with tiebreaker rules.

## Features

- Add tennis match results between Big 12 teams
- View current standings and tournament seeding
- Automatic tiebreaker application using conference rules
- Match history view with results grouped by date
- Data visualization of team performance

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database

### Environment Setup

1. Copy the example environment file:
   ```
   cp .env.example .env
   ```

2. Edit `.env` file with your database credentials:
   ```
   DB_USER=your_postgres_user
   DB_HOST=localhost
   DB_NAME=your_db_name
   DB_PASSWORD=your_password
   DB_PORT=5432
   PORT=3000
   ```

### Database Setup

The database will be automatically initialized when you run the app for the first time, but you can also set it up manually:

```sql
CREATE TABLE tennis_matches (
  id SERIAL PRIMARY KEY,
  team1 VARCHAR(100),
  team2 VARCHAR(100),
  team1_score INTEGER,
  team2_score INTEGER,
  match_date DATE,
  conference VARCHAR(100)
);
```

### Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Start the application:
   ```
   npm run dev
   ```

3. Or use the run script:
   ```
   chmod +x run-tiebreaker.sh
   ./run-tiebreaker.sh
   ```

4. Access the application at `http://localhost:3000/tiebreaker.html`

## Tiebreaker Rules

The application implements the Big 12 conference tiebreaker rules:

1. Win percentage (highest to lowest)
2. Head-to-head results (for two tied teams)
3. Mini round-robin record (for three or more tied teams)

## API Endpoints

- `GET /api/matches` - Get all match results
- `POST /api/matches` - Add a new match
- `GET /api/tiebreaker/:conference` - Get standings with tiebreakers applied

## Usage

1. Add match results using the form or quick buttons
2. View updated standings in real-time
3. See tiebreaker applications in the seedings section

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 