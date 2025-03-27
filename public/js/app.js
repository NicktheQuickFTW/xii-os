// Set today's date when page loads
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('match_date')) {
        document.getElementById('match_date').value = new Date().toISOString().split('T')[0];
    }
    
    // Add event listener for the match form
    const matchForm = document.getElementById('match-form');
    if (matchForm) {
        matchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = {
                team1: document.getElementById('team1').value,
                team2: document.getElementById('team2').value,
                team1_score: parseInt(document.getElementById('team1_score').value),
                team2_score: parseInt(document.getElementById('team2_score').value),
                match_date: document.getElementById('match_date').value,
                conference: document.getElementById('conference').value
            };
            
            addMatch(formData);
        });
    }
    
    // Load initial data
    if (document.getElementById('standings-container')) {
        loadStandings();
    }
    
    if (document.getElementById('matches-container')) {
        loadMatches();
    }
    
    // Add event listeners for quick team selection
    document.querySelectorAll('.quick-button').forEach(button => {
        if (button.innerText.includes('-')) {
            // This is a match button
            button.addEventListener('click', function() {
                const text = this.innerText;
                const parts = text.split(' ');
                const team1 = parts[0];
                const scoreText = parts[1];
                const team2 = parts.slice(2).join(' ');
                
                const scores = scoreText.split('-');
                const score1 = parseInt(scores[0]);
                const score2 = parseInt(scores[1]);
                
                quickAddMatch(team1, team2, score1, score2);
            });
        } else {
            // This is a team button
            const targetId = button.getAttribute('onclick').includes('team1') ? 'team1' : 'team2';
            button.addEventListener('click', function() {
                document.getElementById(targetId).value = this.innerText;
            });
        }
    });
    
    // Remove the inline onclick attributes since we've added listeners
    document.querySelectorAll('.quick-button').forEach(button => {
        button.removeAttribute('onclick');
    });
});

// Quick add a match
function quickAddMatch(team1, team2, score1, score2) {
    const match = {
        team1: team1,
        team2: team2,
        team1_score: score1,
        team2_score: score2,
        match_date: document.getElementById('match_date').value,
        conference: 'Big 12'
    };
    
    addMatch(match);
}

// Send match data to the server
function addMatch(matchData) {
    // Reset messages
    const addError = document.getElementById('add-error');
    const addSuccess = document.getElementById('add-success');
    
    if (addError) addError.textContent = '';
    if (addSuccess) addSuccess.textContent = '';
    
    fetch('/api/matches', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(matchData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to add match');
        }
        return response.json();
    })
    .then(data => {
        if (addSuccess) {
            addSuccess.textContent = 
                `Match added: ${matchData.team1} ${matchData.team1_score}-${matchData.team2_score} ${matchData.team2}`;
        }
        
        // Clear form fields
        if (document.getElementById('team1')) document.getElementById('team1').value = '';
        if (document.getElementById('team2')) document.getElementById('team2').value = '';
        if (document.getElementById('team1_score')) document.getElementById('team1_score').value = '';
        if (document.getElementById('team2_score')) document.getElementById('team2_score').value = '';
        
        // Refresh standings if they exist
        if (document.getElementById('standings-container')) {
            loadStandings();
        }
    })
    .catch(error => {
        if (addError) {
            addError.textContent = error.message;
        }
    });
}

// Load standings
function loadStandings() {
    const standingsContainer = document.getElementById('standings-container');
    const standingsError = document.getElementById('standings-error');
    
    if (!standingsContainer || !standingsError) return;
    
    standingsContainer.innerHTML = '<p>Loading standings...</p>';
    standingsError.textContent = '';
    
    fetch('/api/tiebreaker/Big 12')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load standings');
            }
            return response.json();
        })
        .then(data => {
            if (!data.regular_standings || data.regular_standings.length === 0) {
                standingsContainer.innerHTML = '<p>No standings data available.</p>';
                return;
            }
            
            // Final seedings
            const seedingsSection = document.createElement('div');
            seedingsSection.className = 'seedings-section';
            seedingsSection.innerHTML = '<h3>Final Tournament Seedings</h3>';
            
            const seedingsGrid = document.createElement('div');
            seedingsGrid.className = 'seedings-grid';
            
            data.final_seedings.forEach(team => {
                const teamCard = document.createElement('div');
                teamCard.className = 'team-card';
                
                let tiebreakerInfo = '';
                if (team.tiebreaker_applied) {
                    tiebreakerInfo = `<div class="tiebreaker-info">Tiebreaker: ${team.tiebreaker_applied}</div>`;
                }
                
                teamCard.innerHTML = `
                    <div class="team-card-content">
                        <div class="seed-number">${team.seed}</div>
                        <div class="team-info">
                            <div class="team-name">${team.team}</div>
                            <div class="team-record">${team.wins}-${team.losses} (${(team.win_percentage * 100).toFixed(1)}%)</div>
                            ${tiebreakerInfo}
                        </div>
                    </div>
                `;
                
                seedingsGrid.appendChild(teamCard);
            });
            
            seedingsSection.appendChild(seedingsGrid);
            standingsContainer.innerHTML = '';
            standingsContainer.appendChild(seedingsSection);
            
            // Regular standings
            const standingsTable = document.createElement('table');
            standingsTable.className = 'standings-table';
            standingsTable.innerHTML = `
                <thead>
                    <tr>
                        <th>Team</th>
                        <th>MP</th>
                        <th>W</th>
                        <th>L</th>
                        <th>Win %</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;
            
            const tbody = standingsTable.querySelector('tbody');
            
            data.regular_standings.forEach(team => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${team.team}</td>
                    <td>${team.matches_played}</td>
                    <td>${team.wins}</td>
                    <td>${team.losses}</td>
                    <td>${(team.win_percentage * 100).toFixed(1)}%</td>
                `;
                tbody.appendChild(row);
            });
            
            const regularSection = document.createElement('div');
            regularSection.className = 'regular-standings';
            regularSection.innerHTML = '<h3>Regular Season Standings</h3>';
            regularSection.appendChild(standingsTable);
            
            standingsContainer.appendChild(regularSection);
        })
        .catch(error => {
            standingsError.textContent = error.message;
        });
}

// Load matches
function loadMatches() {
    const matchesContainer = document.getElementById('matches-container');
    const matchesError = document.getElementById('matches-error');
    
    if (!matchesContainer || !matchesError) return;
    
    matchesContainer.innerHTML = '<p>Loading matches...</p>';
    matchesError.textContent = '';
    
    fetch('/api/matches')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load matches');
            }
            return response.json();
        })
        .then(data => {
            matchesContainer.innerHTML = '';
            
            if (data.length === 0) {
                matchesContainer.innerHTML = '<div class="empty-state">No match data available. Add some matches to see them here.</div>';
                return;
            }
            
            // Group matches by date
            const matchesByDate = {};
            data.forEach(match => {
                const date = new Date(match.match_date);
                const dateString = date.toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                });
                
                if (!matchesByDate[dateString]) {
                    matchesByDate[dateString] = [];
                }
                
                matchesByDate[dateString].push(match);
            });
            
            // Create match cards for each date
            const matchTimeline = document.createElement('div');
            matchTimeline.className = 'match-timeline';
            
            Object.keys(matchesByDate).sort((a, b) => {
                return new Date(b) - new Date(a); // Sort descending
            }).forEach(dateString => {
                const dateGroup = document.createElement('div');
                dateGroup.className = 'date-group';
                
                const dateHeader = document.createElement('h3');
                dateHeader.className = 'date-header';
                dateHeader.textContent = dateString;
                dateGroup.appendChild(dateHeader);
                
                const matchesList = document.createElement('div');
                matchesList.className = 'matches-list';
                
                matchesByDate[dateString].forEach(match => {
                    const matchCard = document.createElement('div');
                    matchCard.className = 'match-card';
                    
                    const team1Won = match.team1_score > match.team2_score;
                    const team2Won = match.team2_score > match.team1_score;
                    
                    matchCard.innerHTML = `
                        <div class="match-teams">
                            <div class="match-team ${team1Won ? 'winner' : ''}">
                                <div class="team-name">${match.team1}</div>
                                <div class="team-score">${match.team1_score}</div>
                            </div>
                            <div class="match-vs">VS</div>
                            <div class="match-team ${team2Won ? 'winner' : ''}">
                                <div class="team-name">${match.team2}</div>
                                <div class="team-score">${match.team2_score}</div>
                            </div>
                        </div>
                        <div class="match-meta">
                            <div class="match-conference">${match.conference}</div>
                        </div>
                    `;
                    
                    matchesList.appendChild(matchCard);
                });
                
                dateGroup.appendChild(matchesList);
                matchTimeline.appendChild(dateGroup);
            });
            
            matchesContainer.appendChild(matchTimeline);
            
            // Add CSS for match timeline
            const style = document.createElement('style');
            style.textContent = `
                .match-timeline {
                    margin-top: 20px;
                }
                
                .date-group {
                    margin-bottom: 30px;
                }
                
                .date-header {
                    font-size: 1.1rem;
                    color: var(--light-text);
                    margin-bottom: 15px;
                    border-bottom: 1px solid var(--border-color);
                    padding-bottom: 8px;
                }
                
                .matches-list {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    gap: 15px;
                }
                
                .match-card {
                    background-color: white;
                    border-radius: 8px;
                    padding: 15px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                
                .match-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                }
                
                .match-teams {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }
                
                .match-team {
                    text-align: center;
                    flex: 1;
                }
                
                .match-team.winner {
                    font-weight: bold;
                }
                
                .match-team.winner .team-score {
                    background-color: var(--primary-color);
                    color: white;
                }
                
                .team-name {
                    margin-bottom: 8px;
                    font-size: 0.9rem;
                }
                
                .team-score {
                    background-color: var(--light-bg);
                    color: var(--text-color);
                    font-size: 1.5rem;
                    font-weight: bold;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    margin: 0 auto;
                }
                
                .match-vs {
                    font-size: 0.8rem;
                    color: var(--light-text);
                    margin: 0 10px;
                }
                
                .match-meta {
                    font-size: 0.8rem;
                    color: var(--light-text);
                    text-align: center;
                    border-top: 1px solid var(--border-color);
                    padding-top: 10px;
                }
                
                .empty-state {
                    text-align: center;
                    color: var(--light-text);
                    padding: 30px;
                    background-color: var(--light-bg);
                    border-radius: 8px;
                }
            `;
            
            matchesContainer.appendChild(style);
        })
        .catch(error => {
            matchesError.textContent = error.message;
        });
}

// Load head-to-head
function loadHeadToHead() {
    const h2hContainer = document.getElementById('h2h-container');
    const h2hError = document.getElementById('h2h-error');
    const team1 = document.getElementById('h2h-team1').value;
    const team2 = document.getElementById('h2h-team2').value;
    
    if (!h2hContainer || !h2hError || !team1 || !team2) {
        if (h2hError) h2hError.textContent = 'Please enter both teams';
        return;
    }
    
    h2hContainer.innerHTML = '<p>Loading head-to-head comparison...</p>';
    h2hError.textContent = '';
    
    fetch(`/api/head-to-head/${encodeURIComponent(team1)}/${encodeURIComponent(team2)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load head-to-head data');
            }
            return response.json();
        })
        .then(data => {
            // Check if data is valid
            if (!data.matches || !data[team1] || !data[team2]) {
                h2hContainer.innerHTML = '<p>No matches found between these teams.</p>';
                return;
            }
            
            // Create comparison card
            const comparisonSection = document.createElement('div');
            comparisonSection.className = 'comparison-section';
            
            // Create head-to-head summary
            const summaryDiv = document.createElement('div');
            summaryDiv.className = 'h2h-summary';
            
            // Determine which team has a better record for styling
            const team1Wins = data[team1];
            const team2Wins = data[team2];
            const team1Class = team1Wins > team2Wins ? 'winning-team' : (team1Wins < team2Wins ? 'losing-team' : '');
            const team2Class = team2Wins > team1Wins ? 'winning-team' : (team2Wins < team1Wins ? 'losing-team' : '');
            
            summaryDiv.innerHTML = `
                <div class="h2h-header">
                    <h3>${team1} vs ${team2}</h3>
                    <p class="series-status">${data.winner !== 'Tied' ? `${data.winner} leads the series` : 'Series is tied'}</p>
                </div>
                <div class="h2h-record">
                    <div class="team-record ${team1Class}">
                        <div class="team-name">${team1}</div>
                        <div class="win-count">${team1Wins}</div>
                    </div>
                    <div class="vs-divider">
                        <span>VS</span>
                    </div>
                    <div class="team-record ${team2Class}">
                        <div class="team-name">${team2}</div>
                        <div class="win-count">${team2Wins}</div>
                    </div>
                </div>
            `;
            
            comparisonSection.appendChild(summaryDiv);
            
            // Add match history
            if (data.matches.length > 0) {
                const historyDiv = document.createElement('div');
                historyDiv.className = 'match-history';
                historyDiv.innerHTML = '<h3>Match History</h3>';
                
                const table = document.createElement('table');
                table.innerHTML = `
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Team 1</th>
                            <th>Score</th>
                            <th>Team 2</th>
                            <th>Winner</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                `;
                
                const tbody = table.querySelector('tbody');
                
                data.matches.forEach(match => {
                    const date = new Date(match.match_date).toLocaleDateString();
                    const isTeam1Winner = match.team1_score > match.team2_score;
                    const winner = isTeam1Winner ? match.team1 : match.team2;
                    const isSelectedTeam1Winner = (match.team1 === team1 && isTeam1Winner) || (match.team2 === team1 && !isTeam1Winner);
                    
                    const row = document.createElement('tr');
                    row.className = isSelectedTeam1Winner ? 'team1-win' : 'team2-win';
                    
                    row.innerHTML = `
                        <td>${date}</td>
                        <td>${match.team1}</td>
                        <td><strong>${match.team1_score} - ${match.team2_score}</strong></td>
                        <td>${match.team2}</td>
                        <td><span class="winner-name">${winner}</span></td>
                    `;
                    
                    tbody.appendChild(row);
                });
                
                historyDiv.appendChild(table);
                comparisonSection.appendChild(historyDiv);
            } else {
                comparisonSection.innerHTML += '<p>No match history available between these teams.</p>';
            }
            
            h2hContainer.innerHTML = '';
            h2hContainer.appendChild(comparisonSection);
            
            // Add CSS for head-to-head elements
            const style = document.createElement('style');
            style.textContent = `
                .h2h-summary {
                    background-color: #f8f9fa;
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 30px;
                    text-align: center;
                }
                
                .h2h-header {
                    margin-bottom: 20px;
                }
                
                .h2h-header h3 {
                    font-size: 1.6rem;
                    margin-bottom: 5px;
                }
                
                .series-status {
                    color: var(--light-text);
                    font-size: 1.1rem;
                }
                
                .h2h-record {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 20px;
                }
                
                .team-record {
                    text-align: center;
                    padding: 15px 25px;
                    border-radius: 8px;
                    background-color: white;
                    box-shadow: 0 3px 10px rgba(0,0,0,0.05);
                    min-width: 120px;
                }
                
                .team-record.winning-team {
                    background-color: var(--success-color);
                    color: white;
                }
                
                .team-record.losing-team {
                    background-color: white;
                    border: 1px solid var(--border-color);
                }
                
                .team-name {
                    font-weight: bold;
                    margin-bottom: 10px;
                }
                
                .win-count {
                    font-size: 2.5rem;
                    font-weight: bold;
                }
                
                .vs-divider {
                    height: 50px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--light-text);
                    font-weight: bold;
                }
                
                .match-history h3 {
                    margin-bottom: 15px;
                }
                
                .team1-win {
                    background-color: rgba(39, 174, 96, 0.1);
                }
                
                .team2-win {
                    background-color: rgba(231, 76, 60, 0.1);
                }
                
                .winner-name {
                    font-weight: bold;
                    color: var(--primary-color);
                }
                
                @media (max-width: 768px) {
                    .h2h-record {
                        flex-direction: column;
                    }
                    
                    .vs-divider {
                        height: auto;
                        margin: 10px 0;
                    }
                }
            `;
            
            h2hContainer.appendChild(style);
        })
        .catch(error => {
            h2hError.textContent = error.message;
        });
} 