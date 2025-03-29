#!/bin/bash

# Check if database is set up - if tennis_matches table doesn't exist, initialize it
psql -U $DB_USER -d $DB_NAME -t -c "SELECT EXISTS(SELECT FROM information_schema.tables WHERE table_name = 'tennis_matches')" | grep -q f
if [ $? -eq 0 ]; then
  echo "Setting up database tables..."
  psql -U $DB_USER -d $DB_NAME -c "
    CREATE TABLE IF NOT EXISTS tennis_matches (
      id SERIAL PRIMARY KEY,
      team1 VARCHAR(100),
      team2 VARCHAR(100),
      team1_score INTEGER,
      team2_score INTEGER,
      match_date DATE,
      conference VARCHAR(100)
    );
  "
  echo "Database setup complete."
fi

# Start the server
echo "Starting Tennis Tiebreaker app..."
node app.js 