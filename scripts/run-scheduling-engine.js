#!/usr/bin/env node

/**
 * FlexTime Scheduling Engine Runner
 * 
 * This script provides a simple way to run the scheduling engine from the command line.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const schedulingEngine = require('../modules/athletic-competition/scheduling-engine');

// Sample configuration for different sports
const sampleConfigs = {
  basketball: {
    sport: 'basketball',
    seasonStart: '2024-11-01',
    seasonEnd: '2025-03-15',
    competitionFormat: 'double-round-robin',
    gamesPerTeam: 18,
    teams: [
      { id: 'team1', name: 'BYU Cougars', location: 'Provo, UT', 
        coordinates: { lat: 40.2338, lng: -111.6585 }, venue: 'Marriott Center', conference: 'Big 12' },
      { id: 'team2', name: 'Kansas Jayhawks', location: 'Lawrence, KS', 
        coordinates: { lat: 38.9543, lng: -95.2558 }, venue: 'Allen Fieldhouse', conference: 'Big 12' },
      { id: 'team3', name: 'Texas Tech Red Raiders', location: 'Lubbock, TX', 
        coordinates: { lat: 33.5843, lng: -101.8783 }, venue: 'United Supermarkets Arena', conference: 'Big 12' },
      { id: 'team4', name: 'Iowa State Cyclones', location: 'Ames, IA', 
        coordinates: { lat: 42.0266, lng: -93.6465 }, venue: 'Hilton Coliseum', conference: 'Big 12' },
      { id: 'team5', name: 'Baylor Bears', location: 'Waco, TX', 
        coordinates: { lat: 31.5493, lng: -97.1467 }, venue: 'Foster Pavilion', conference: 'Big 12' },
      { id: 'team6', name: 'Cincinnati Bearcats', location: 'Cincinnati, OH', 
        coordinates: { lat: 39.1329, lng: -84.5150 }, venue: 'Fifth Third Arena', conference: 'Big 12' },
      { id: 'team7', name: 'West Virginia Mountaineers', location: 'Morgantown, WV', 
        coordinates: { lat: 39.6500, lng: -79.9559 }, venue: 'WVU Coliseum', conference: 'Big 12' },
      { id: 'team8', name: 'UCF Knights', location: 'Orlando, FL', 
        coordinates: { lat: 28.5984, lng: -81.2001 }, venue: 'Addition Financial Arena', conference: 'Big 12' },
      { id: 'team9', name: 'Arizona Wildcats', location: 'Tucson, AZ', 
        coordinates: { lat: 32.2316, lng: -110.9507 }, venue: 'McKale Center', conference: 'Big 12' },
      { id: 'team10', name: 'Colorado Buffaloes', location: 'Boulder, CO', 
        coordinates: { lat: 40.0076, lng: -105.2659 }, venue: 'CU Events Center', conference: 'Big 12' }
    ],
    institutionalConstraints: [
      {
        teamId: 'team1', // BYU
        type: 'no-play-day-of-week',
        dayOfWeek: 0, // Sunday
        description: 'BYU does not play on Sundays for religious reasons'
      }
    ],
    optimizationFactors: {
      travelEfficiency: 1.2,
      competitiveBalance: 1.0,
      tvRevenue: 0.8,
      studentWellbeing: 1.5
    }
  },
  football: {
    sport: 'football',
    seasonStart: '2024-08-30',
    seasonEnd: '2024-12-07',
    competitionFormat: 'partial-round-robin',
    gamesPerTeam: 9,
    teams: [
      { id: 'team1', name: 'BYU Cougars', location: 'Provo, UT', 
        coordinates: { lat: 40.2338, lng: -111.6585 }, venue: 'LaVell Edwards Stadium', conference: 'Big 12' },
      { id: 'team2', name: 'Kansas Jayhawks', location: 'Lawrence, KS', 
        coordinates: { lat: 38.9543, lng: -95.2558 }, venue: 'David Booth Kansas Memorial Stadium', conference: 'Big 12' },
      { id: 'team3', name: 'Texas Tech Red Raiders', location: 'Lubbock, TX', 
        coordinates: { lat: 33.5843, lng: -101.8783 }, venue: 'Jones AT&T Stadium', conference: 'Big 12' },
      { id: 'team4', name: 'Iowa State Cyclones', location: 'Ames, IA', 
        coordinates: { lat: 42.0266, lng: -93.6465 }, venue: 'Jack Trice Stadium', conference: 'Big 12' },
      { id: 'team5', name: 'Baylor Bears', location: 'Waco, TX', 
        coordinates: { lat: 31.5493, lng: -97.1467 }, venue: 'McLane Stadium', conference: 'Big 12' },
      { id: 'team6', name: 'Cincinnati Bearcats', location: 'Cincinnati, OH', 
        coordinates: { lat: 39.1329, lng: -84.5150 }, venue: 'Nippert Stadium', conference: 'Big 12' },
      { id: 'team7', name: 'West Virginia Mountaineers', location: 'Morgantown, WV', 
        coordinates: { lat: 39.6500, lng: -79.9559 }, venue: 'Mountaineer Field', conference: 'Big 12' },
      { id: 'team8', name: 'UCF Knights', location: 'Orlando, FL', 
        coordinates: { lat: 28.5984, lng: -81.2001 }, venue: 'FBC Mortgage Stadium', conference: 'Big 12' },
      { id: 'team9', name: 'Arizona Wildcats', location: 'Tucson, AZ', 
        coordinates: { lat: 32.2316, lng: -110.9507 }, venue: 'Arizona Stadium', conference: 'Big 12' },
      { id: 'team10', name: 'Colorado Buffaloes', location: 'Boulder, CO', 
        coordinates: { lat: 40.0076, lng: -105.2659 }, venue: 'Folsom Field', conference: 'Big 12' }
    ],
    institutionalConstraints: [
      {
        teamId: 'team1', // BYU
        type: 'no-play-day-of-week',
        dayOfWeek: 0, // Sunday
        description: 'BYU does not play on Sundays for religious reasons'
      }
    ],
    optimizationFactors: {
      travelEfficiency: 1.5,
      competitiveBalance: 1.2,
      tvRevenue: 1.8,
      studentWellbeing: 1.0
    }
  }
};

// Command line arguments
const args = process.argv.slice(2);
const sport = args[0] || 'basketball'; // Default to basketball
const action = args[1] || 'generate'; // Default action is generate
const outputPath = args[2] || `./output/${sport}-schedule.json`; // Default output path

// Print usage if help requested
if (sport === 'help' || sport === '--help' || sport === '-h') {
  console.log('Usage: node run-scheduling-engine.js [sport] [action] [outputPath]');
  console.log('');
  console.log('Available sports: basketball, football');
  console.log('Available actions: generate, analyze, optimize');
  console.log('');
  console.log('Examples:');
  console.log('  node run-scheduling-engine.js basketball generate ./output/basketball-schedule.json');
  console.log('  node run-scheduling-engine.js football optimize ./output/football-schedule.json');
  console.log('');
  process.exit(0);
}

// Ensure output directory exists
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Main function
async function main() {
  console.log(`===== FLEXTIME SCHEDULING ENGINE - ${sport.toUpperCase()} =====`);
  
  // Get configuration
  const config = sampleConfigs[sport];
  if (!config) {
    console.error(`Error: Sport "${sport}" not supported. Available sports: basketball, football`);
    process.exit(1);
  }
  
  try {
    switch (action) {
      case 'generate':
        await generateSchedule(config, outputPath);
        break;
        
      case 'analyze':
        await analyzeSchedule(outputPath);
        break;
        
      case 'optimize':
        await optimizeSchedule(outputPath);
        break;
        
      default:
        console.error(`Error: Action "${action}" not supported. Available actions: generate, analyze, optimize`);
        process.exit(1);
    }
    
    console.log('===== COMPLETED SUCCESSFULLY =====');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

/**
 * Generate a schedule and save to output file
 * @param {Object} config - Configuration object
 * @param {string} outputPath - Output file path
 */
async function generateSchedule(config, outputPath) {
  console.log(`Generating ${config.sport} schedule...`);
  
  const result = await schedulingEngine.generateSchedule({
    ...config,
    useClaudeAI: true,
    saveToDatabase: false // We'll save to a file instead
  });
  
  if (!result.success) {
    throw new Error(`Failed to generate schedule: ${result.error}`);
  }
  
  console.log(`Schedule generated with ${result.schedule.weeks.length} weeks and ${countGames(result.schedule)} games`);
  
  // Save to file
  fs.writeFileSync(outputPath, JSON.stringify(result.schedule, null, 2));
  console.log(`Schedule saved to ${outputPath}`);
}

/**
 * Analyze a schedule with Claude AI
 * @param {string} schedulePath - Path to schedule file
 */
async function analyzeSchedule(schedulePath) {
  console.log(`Analyzing schedule from ${schedulePath}...`);
  
  // Load schedule from file
  if (!fs.existsSync(schedulePath)) {
    throw new Error(`Schedule file not found: ${schedulePath}`);
  }
  
  const schedule = JSON.parse(fs.readFileSync(schedulePath, 'utf8'));
  
  // Get analysis
  const analysisResult = await schedulingEngine.getClaudeAnalysis(schedule);
  
  if (!analysisResult.success) {
    throw new Error(`Failed to analyze schedule: ${analysisResult.error}`);
  }
  
  console.log('Claude AI Analysis:');
  console.log('Assessment:', analysisResult.analysis.assessment);
  console.log('');
  console.log('Suggestions:');
  analysisResult.analysis.suggestions.forEach((suggestion, index) => {
    console.log(`${index + 1}. ${suggestion.issue}`);
    if (suggestion.recommendation) {
      console.log(`   Recommendation: ${suggestion.recommendation}`);
    }
  });
  console.log('');
  console.log('Potential Conflicts:');
  analysisResult.analysis.potentialConflicts.forEach((conflict, index) => {
    console.log(`${index + 1}. ${conflict}`);
  });
  
  // Save analysis to file
  const analysisPath = schedulePath.replace('.json', '-analysis.json');
  fs.writeFileSync(analysisPath, JSON.stringify(analysisResult.analysis, null, 2));
  console.log(`Analysis saved to ${analysisPath}`);
}

/**
 * Optimize a schedule with Claude AI
 * @param {string} schedulePath - Path to schedule file
 */
async function optimizeSchedule(schedulePath) {
  console.log(`Optimizing schedule from ${schedulePath}...`);
  
  // Load schedule from file
  if (!fs.existsSync(schedulePath)) {
    throw new Error(`Schedule file not found: ${schedulePath}`);
  }
  
  const schedule = JSON.parse(fs.readFileSync(schedulePath, 'utf8'));
  
  // Optimize
  const optimizedSchedule = await schedulingEngine.optimizeExistingSchedule(
    schedule,
    {
      travelEfficiency: 1.5,
      competitiveBalance: 1.2,
      tvRevenue: 1.0,
      studentWellbeing: 1.8,
      useClaudeAI: true,
      saveToDatabase: false
    }
  );
  
  console.log('Optimization complete');
  
  // Save to file
  const optimizedPath = schedulePath.replace('.json', '-optimized.json');
  fs.writeFileSync(optimizedPath, JSON.stringify(optimizedSchedule, null, 2));
  console.log(`Optimized schedule saved to ${optimizedPath}`);
}

/**
 * Count total games in a schedule
 * @param {Object} schedule - Schedule object
 * @returns {number} Total games
 */
function countGames(schedule) {
  return schedule.weeks.reduce((total, week) => total + week.matchups.length, 0);
}

// Run the script
main(); 