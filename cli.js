const { Pool } = require('pg');
require('dotenv').config();
const readline = require('readline');

// Database connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Main menu
function showMainMenu() {
  console.clear();
  console.log('===================================');
  console.log('  BIG 12 TENNIS TIEBREAKER SYSTEM');
  console.log('===================================');
  console.log('');
  console.log('1. View Standings');
  console.log('2. Add a Match');
  console.log('3. View Match History');
  console.log('4. Head-to-Head Comparison');
  console.log('5. Exit');
  console.log('');
  
  rl.question('Select an option (1-5): ', (answer) => {
    switch(answer.trim()) {
      case '1':
        showStandings();
        break;
      case '2':
        addMatch();
        break;
      case '3':
        viewMatches();
        break;
      case '4':
        headToHead();
        break;
      case '5':
        console.log('Goodbye!');
        rl.close();
        pool.end();
        process.exit(0);
        break;
      default:
        console.log('Invalid option. Press Enter to continue...');
        rl.question('', () => {
          showMainMenu();
        });
    }
  });
}

// View standings with tiebreakers
async function showStandings() {
  console.clear();
  console.log('=== CONFERENCE STANDINGS ===');
  console.log('');
  
  try {
    // Query for team stats
    const statsQuery = `
      WITH team_stats AS (
        SELECT 
          team1 as team,
          CASE 
            WHEN team1_score > team2_score THEN 1
            WHEN team1_score < team2_score THEN 0
            ELSE 0.5
          END as result
        FROM tennis_matches
        UNION ALL
        SELECT 
          team2 as team,
          CASE 
            WHEN team2_score > team1_score THEN 1
            WHEN team2_score < team1_score THEN 0
            ELSE 0.5
          END as result
        FROM tennis_matches
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
    `;
    
    const result = await pool.query(statsQuery);
    
    if (result.rows.length === 0) {
      console.log('No match data available yet.');
    } else {
      console.log('Team              MP   W    L    Win%');
      console.log('------------------------------------');
      
      result.rows.forEach((team, index) => {
        const teamPadded = team.team.padEnd(17);
        const mp = String(team.matches_played).padEnd(5);
        const w = String(team.wins).padEnd(5);
        const l = String(team.losses).padEnd(5);
        const winPct = (team.win_percentage * 100).toFixed(1) + '%';
        
        console.log(`${index + 1}. ${teamPadded}${mp}${w}${l}${winPct}`);
      });
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
  
  console.log('');
  rl.question('Press Enter to return to main menu...', () => {
    showMainMenu();
  });
}

// Add a match
function addMatch() {
  console.clear();
  console.log('=== ADD A MATCH ===');
  console.log('');
  
  rl.question('Team 1: ', (team1) => {
    rl.question('Team 1 Score: ', (team1Score) => {
      rl.question('Team 2: ', (team2) => {
        rl.question('Team 2 Score: ', (team2Score) => {
          
          // Default values
          const match_date = new Date().toISOString().split('T')[0];
          const conference = 'Big 12';
          
          // Insert into database
          pool.query(
            'INSERT INTO tennis_matches (team1, team2, team1_score, team2_score, match_date, conference) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [team1, team2, parseInt(team1Score), parseInt(team2Score), match_date, conference]
          ).then(result => {
            console.log('');
            console.log('Match added successfully:');
            console.log(`${team1} ${team1Score} - ${team2Score} ${team2}`);
            console.log('');
            
            rl.question('Add another match? (y/n): ', (answer) => {
              if (answer.toLowerCase() === 'y') {
                addMatch();
              } else {
                showMainMenu();
              }
            });
          }).catch(err => {
            console.error('Error adding match:', err.message);
            console.log('');
            rl.question('Press Enter to continue...', () => {
              addMatch();
            });
          });
        });
      });
    });
  });
}

// View match history
async function viewMatches() {
  console.clear();
  console.log('=== MATCH HISTORY ===');
  console.log('');
  
  try {
    const result = await pool.query('SELECT * FROM tennis_matches ORDER BY match_date DESC');
    
    if (result.rows.length === 0) {
      console.log('No matches recorded yet.');
    } else {
      result.rows.forEach((match, index) => {
        const date = new Date(match.match_date).toLocaleDateString();
        console.log(`${index + 1}. [${date}] ${match.team1} ${match.team1_score} - ${match.team2_score} ${match.team2}`);
      });
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
  
  console.log('');
  rl.question('Press Enter to return to main menu...', () => {
    showMainMenu();
  });
}

// Head-to-head comparison
function headToHead() {
  console.clear();
  console.log('=== HEAD-TO-HEAD COMPARISON ===');
  console.log('');
  
  rl.question('Enter first team: ', async (team1) => {
    rl.question('Enter second team: ', async (team2) => {
      try {
        const result = await pool.query(`
          SELECT * FROM tennis_matches 
          WHERE (team1 = $1 AND team2 = $2) OR (team1 = $2 AND team2 = $1)
          ORDER BY match_date DESC
        `, [team1, team2]);
        
        console.log('');
        console.log(`${team1} vs ${team2}`);
        console.log('--------------------');
        
        if (result.rows.length === 0) {
          console.log('No matches found between these teams.');
        } else {
          let team1Wins = 0;
          let team2Wins = 0;
          
          result.rows.forEach((match, index) => {
            const date = new Date(match.match_date).toLocaleDateString();
            console.log(`${index + 1}. [${date}] ${match.team1} ${match.team1_score} - ${match.team2_score} ${match.team2}`);
            
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
          
          console.log('');
          console.log('Head-to-Head Record:');
          console.log(`${team1}: ${team1Wins} wins`);
          console.log(`${team2}: ${team2Wins} wins`);
          
          if (team1Wins > team2Wins) {
            console.log(`${team1} leads the series.`);
          } else if (team2Wins > team1Wins) {
            console.log(`${team2} leads the series.`);
          } else {
            console.log('The series is tied.');
          }
        }
      } catch (err) {
        console.error('Error:', err.message);
      }
      
      console.log('');
      rl.question('Press Enter to return to main menu...', () => {
        showMainMenu();
      });
    });
  });
}

// Start the application
console.log('Connecting to database...');
pool.query('SELECT NOW()')
  .then(() => {
    console.log('Connected to database successfully.');
    showMainMenu();
  })
  .catch(err => {
    console.error('Failed to connect to the database:', err.message);
    rl.close();
    process.exit(1);
  }); 