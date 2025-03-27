const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"]
    }
  }
}));
app.use(compression());
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Add no-cache middleware
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve app.html with no-cache headers
app.get('/app.html', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  res.sendFile(path.join(__dirname, 'public', 'app.html'));
});

// Add a new match
app.post('/api/matches', async (req, res) => {
  try {
    const { team1, team2, team1_score, team2_score, match_date, conference } = req.body;
    const result = await pool.query(
      'INSERT INTO tennis_matches (team1, team2, team1_score, team2_score, match_date, conference) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [team1, team2, team1_score, team2_score, match_date, conference]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all matches
app.get('/api/matches', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tennis_matches ORDER BY match_date DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get conference standings
app.get('/api/standings/:conference', async (req, res) => {
  try {
    const { conference } = req.params;
    const result = await pool.query(`
      WITH team_stats AS (
        SELECT 
          team1 as team,
          CASE 
            WHEN team1_score > team2_score THEN 1
            WHEN team1_score < team2_score THEN 0
            ELSE 0.5
          END as result
        FROM tennis_matches
        WHERE conference = $1
        UNION ALL
        SELECT 
          team2 as team,
          CASE 
            WHEN team2_score > team1_score THEN 1
            WHEN team2_score < team1_score THEN 0
            ELSE 0.5
          END as result
        FROM tennis_matches
        WHERE conference = $1
      )
      SELECT 
        team,
        COUNT(*) as matches_played,
        SUM(result) as wins,
        COUNT(*) - SUM(result) as losses,
        ROUND(SUM(result)::numeric / COUNT(*), 3) as win_percentage
      FROM team_stats
      GROUP BY team
      ORDER BY win_percentage DESC, wins DESC
    `, [conference]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get head-to-head results between two teams
app.get('/api/head-to-head/:team1/:team2', async (req, res) => {
  try {
    const { team1, team2 } = req.params;
    const result = await pool.query(`
      SELECT * FROM tennis_matches 
      WHERE (team1 = $1 AND team2 = $2) OR (team1 = $2 AND team2 = $1)
      ORDER BY match_date DESC
    `, [team1, team2]);
    
    // Calculate head-to-head record
    let team1Wins = 0;
    let team2Wins = 0;
    
    result.rows.forEach(match => {
      if (match.team1 === team1 && match.team1_score > match.team2_score) {
        team1Wins++;
      } else if (match.team1 === team2 && match.team1_score > match.team2_score) {
        team2Wins++;
      } else if (match.team2 === team1 && match.team2_score > match.team1_score) {
        team1Wins++;
      } else if (match.team2 === team2 && match.team2_score > match.team1_score) {
        team2Wins++;
      }
    });
    
    res.json({
      matches: result.rows,
      [team1]: team1Wins,
      [team2]: team2Wins,
      winner: team1Wins > team2Wins ? team1 : team2Wins > team1Wins ? team2 : 'Tied'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Apply tiebreaker logic to get final seeds
app.get('/api/tiebreaker/:conference', async (req, res) => {
  try {
    const { conference } = req.params;
    
    // First get the regular standings
    const standingsResult = await pool.query(`
      WITH team_stats AS (
        SELECT 
          team1 as team,
          CASE 
            WHEN team1_score > team2_score THEN 1
            WHEN team1_score < team2_score THEN 0
            ELSE 0.5
          END as result
        FROM tennis_matches
        WHERE conference = $1
        UNION ALL
        SELECT 
          team2 as team,
          CASE 
            WHEN team2_score > team1_score THEN 1
            WHEN team2_score < team1_score THEN 0
            ELSE 0.5
          END as result
        FROM tennis_matches
        WHERE conference = $1
      )
      SELECT 
        team,
        COUNT(*) as matches_played,
        SUM(result) as wins,
        COUNT(*) - SUM(result) as losses,
        ROUND(SUM(result)::numeric / COUNT(*), 3) as win_percentage
      FROM team_stats
      GROUP BY team
      ORDER BY win_percentage DESC, wins DESC
    `, [conference]);
    
    const standings = standingsResult.rows;
    
    // Find tied teams
    const tiedTeams = {};
    const finalSeedings = [];
    
    // Group teams by win percentage
    standings.forEach(team => {
      const winPct = team.win_percentage;
      if (!tiedTeams[winPct]) {
        tiedTeams[winPct] = [];
      }
      tiedTeams[winPct].push(team);
    });
    
    // Process each group of teams
    for (const winPct in tiedTeams) {
      const teamsGroup = tiedTeams[winPct];
      
      // If only one team at this win percentage, no tiebreaker needed
      if (teamsGroup.length === 1) {
        finalSeedings.push({
          ...teamsGroup[0],
          tiebreaker_applied: false,
          seed: finalSeedings.length + 1
        });
        continue;
      }
      
      // If two teams, use head-to-head
      if (teamsGroup.length === 2) {
        const team1 = teamsGroup[0].team;
        const team2 = teamsGroup[1].team;
        
        const h2hResult = await pool.query(`
          SELECT
            SUM(CASE 
              WHEN (team1 = $1 AND team1_score > team2_score) OR (team2 = $1 AND team2_score > team1_score) THEN 1
              ELSE 0
            END) as team1_wins,
            SUM(CASE 
              WHEN (team1 = $2 AND team1_score > team2_score) OR (team2 = $2 AND team2_score > team1_score) THEN 1
              ELSE 0
            END) as team2_wins
          FROM tennis_matches
          WHERE ((team1 = $1 AND team2 = $2) OR (team1 = $2 AND team2 = $1)) AND conference = $3
        `, [team1, team2, conference]);
        
        const { team1_wins, team2_wins } = h2hResult.rows[0];
        
        if (team1_wins > team2_wins) {
          finalSeedings.push({
            ...teamsGroup[0],
            tiebreaker_applied: 'head-to-head',
            seed: finalSeedings.length + 1
          });
          finalSeedings.push({
            ...teamsGroup[1],
            tiebreaker_applied: 'head-to-head',
            seed: finalSeedings.length + 2
          });
        } else if (team2_wins > team1_wins) {
          finalSeedings.push({
            ...teamsGroup[1], 
            tiebreaker_applied: 'head-to-head',
            seed: finalSeedings.length + 1
          });
          finalSeedings.push({
            ...teamsGroup[0],
            tiebreaker_applied: 'head-to-head',
            seed: finalSeedings.length + 2
          });
        } else {
          // If still tied, keep original order but note it's still tied
          teamsGroup.forEach((team, i) => {
            finalSeedings.push({
              ...team,
              tiebreaker_applied: 'head-to-head (still tied)',
              seed: finalSeedings.length + i + 1
            });
          });
        }
        continue;
      }
      
      // If more than two teams, apply mini round-robin
      // (Note: This is a simplified implementation - a full implementation would need more complex logic)
      const teamNames = teamsGroup.map(t => t.team);
      const miniRoundRobinResults = {};
      
      // Initialize results for each team
      teamNames.forEach(team => {
        miniRoundRobinResults[team] = { wins: 0, matches: 0 };
      });
      
      // Get all matches between these teams
      const h2hQuery = `
        SELECT * FROM tennis_matches 
        WHERE conference = $1 
        AND (
          (team1 = ANY($2) AND team2 = ANY($2))
        )
      `;
      
      const h2hResult = await pool.query(h2hQuery, [conference, teamNames]);
      
      // Calculate mini round-robin records
      h2hResult.rows.forEach(match => {
        if (teamNames.includes(match.team1) && teamNames.includes(match.team2)) {
          miniRoundRobinResults[match.team1].matches++;
          miniRoundRobinResults[match.team2].matches++;
          
          if (match.team1_score > match.team2_score) {
            miniRoundRobinResults[match.team1].wins++;
          } else if (match.team2_score > match.team1_score) {
            miniRoundRobinResults[match.team2].wins++;
          } else {
            // Tie - half win to each
            miniRoundRobinResults[match.team1].wins += 0.5;
            miniRoundRobinResults[match.team2].wins += 0.5;
          }
        }
      });
      
      // Calculate win percentages for mini round-robin
      const miniRoundRobinPercentages = {};
      for (const team in miniRoundRobinResults) {
        const { wins, matches } = miniRoundRobinResults[team];
        miniRoundRobinPercentages[team] = matches > 0 ? wins / matches : 0;
      }
      
      // Sort teams by mini round-robin win percentage
      const sortedTeams = teamNames.sort((a, b) => {
        return miniRoundRobinPercentages[b] - miniRoundRobinPercentages[a];
      });
      
      // Add to final seedings
      const teamMap = {};
      teamsGroup.forEach(team => {
        teamMap[team.team] = team;
      });
      
      sortedTeams.forEach((teamName, i) => {
        const originalTeam = teamMap[teamName];
        finalSeedings.push({
          ...originalTeam,
          tiebreaker_applied: 'mini round-robin',
          mini_rr_percentage: miniRoundRobinPercentages[teamName],
          seed: finalSeedings.length + i + 1
        });
      });
    }
    
    res.json({
      regular_standings: standings,
      final_seedings: finalSeedings
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Transfer Portal Module Routes
const transferPortal = require('./modules/transfer-portal');
app.use('/api/transfer-portal/players', transferPortal.routes.players);
app.use('/api/transfer-portal/nil-valuations', transferPortal.routes.nilValuations);

// app.use('/api/content-management', require('./modules/content-management/routes'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; 