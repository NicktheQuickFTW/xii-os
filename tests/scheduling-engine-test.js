/**
 * FlexTime Scheduling Engine Test Script
 * 
 * This script tests the FlexTime scheduling engine with Cloud database and Claude AI integration
 */

const schedulingEngine = require('../modules/athletic-competition/scheduling-engine');

// Configuration for a simple basketball schedule
const testConfig = {
  sport: 'basketball',
  seasonStart: '2024-11-01',
  seasonEnd: '2025-03-15',
  competitionFormat: 'double-round-robin',
  gamesPerTeam: 18,
  
  // 10 teams for testing
  teams: [
    { id: 'team1', name: 'BYU Cougars', location: 'Provo, UT', venue: 'Marriott Center', conference: 'Big 12' },
    { id: 'team2', name: 'Kansas Jayhawks', location: 'Lawrence, KS', venue: 'Allen Fieldhouse', conference: 'Big 12' },
    { id: 'team3', name: 'Texas Tech Red Raiders', location: 'Lubbock, TX', venue: 'United Supermarkets Arena', conference: 'Big 12' },
    { id: 'team4', name: 'Iowa State Cyclones', location: 'Ames, IA', venue: 'Hilton Coliseum', conference: 'Big 12' },
    { id: 'team5', name: 'Baylor Bears', location: 'Waco, TX', venue: 'Foster Pavilion', conference: 'Big 12' },
    { id: 'team6', name: 'Cincinnati Bearcats', location: 'Cincinnati, OH', venue: 'Fifth Third Arena', conference: 'Big 12' },
    { id: 'team7', name: 'West Virginia Mountaineers', location: 'Morgantown, WV', venue: 'WVU Coliseum', conference: 'Big 12' },
    { id: 'team8', name: 'UCF Knights', location: 'Orlando, FL', venue: 'Addition Financial Arena', conference: 'Big 12' },
    { id: 'team9', name: 'Arizona Wildcats', location: 'Tucson, AZ', venue: 'McKale Center', conference: 'Big 12' },
    { id: 'team10', name: 'Colorado Buffaloes', location: 'Boulder, CO', venue: 'CU Events Center', conference: 'Big 12' }
  ],
  
  // Add coordinates for travel calculation
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
  
  // Institutional constraints
  institutionalConstraints: [
    {
      teamId: 'team1', // BYU
      type: 'no-play-day-of-week',
      dayOfWeek: 0, // Sunday
      description: 'BYU does not play on Sundays for religious reasons'
    }
  ],
  
  // Optimization factors
  optimizationFactors: {
    travelEfficiency: 1.2,
    competitiveBalance: 1.0,
    tvRevenue: 0.8,
    studentWellbeing: 1.5
  }
};

// ================= MAIN TEST FUNCTIONS =================

/**
 * Run full integration test
 */
async function runIntegrationTest() {
  console.log('===== FLEXTIME SCHEDULING ENGINE TEST =====');
  console.log('Testing with cloud database and Claude AI integration');
  console.log('');
  
  try {
    // Step 1: Save configuration to database
    console.log('Step 1: Saving configuration to database...');
    const configResult = await schedulingEngine.saveConfigurationToDatabase(
      testConfig, 
      'Test Basketball Configuration'
    );
    
    console.log(`Configuration saved with ID: ${configResult.configId}`);
    console.log('');
    
    // Step 2: Generate schedule with Claude AI optimization
    console.log('Step 2: Generating schedule with Claude AI optimization...');
    const scheduleResult = await schedulingEngine.generateSchedule({
      ...testConfig,
      useClaudeAI: true,
      saveToDatabase: true,
      scheduleName: 'Test Basketball Schedule'
    });
    
    if (!scheduleResult.success) {
      throw new Error(`Failed to generate schedule: ${scheduleResult.error}`);
    }
    
    const schedule = scheduleResult.schedule;
    const scheduleId = scheduleResult.dbResult?.scheduleId;
    
    console.log(`Schedule generated with ${schedule.weeks.length} weeks and ${countGames(schedule)} games`);
    console.log(`Schedule saved with ID: ${scheduleId}`);
    console.log('');
    
    // Step 3: Analyze schedule with Claude AI
    console.log('Step 3: Analyzing schedule with Claude AI...');
    const analysisResult = await schedulingEngine.getClaudeAnalysis(schedule);
    
    if (!analysisResult.success) {
      throw new Error(`Failed to analyze schedule: ${analysisResult.error}`);
    }
    
    console.log('Claude AI Analysis:');
    console.log('Assessment:', analysisResult.analysis.assessment);
    console.log('Suggestions:', analysisResult.analysis.suggestions.length);
    console.log('Potential Conflicts:', analysisResult.analysis.potentialConflicts.length);
    console.log('');
    
    // Step 4: Optimize the schedule further
    console.log('Step 4: Optimizing schedule further...');
    const optimizationResult = await schedulingEngine.optimizeExistingSchedule(
      schedule,
      {
        travelEfficiency: 1.5,
        competitiveBalance: 1.2,
        tvRevenue: 1.0,
        studentWellbeing: 1.8,
        useClaudeAI: true,
        saveToDatabase: true,
        scheduleName: 'Optimized Basketball Schedule'
      }
    );
    
    console.log('Optimization complete');
    console.log('');
    
    // Step 5: List all schedules and configurations
    console.log('Step 5: Listing saved schedules and configurations...');
    const schedulesResult = await schedulingEngine.listSchedules({ sport: 'basketball' });
    
    if (!schedulesResult.success) {
      throw new Error(`Failed to list schedules: ${schedulesResult.error}`);
    }
    
    console.log(`Found ${schedulesResult.schedules.length} basketball schedules in database`);
    
    const configurationsResult = await schedulingEngine.listConfigurations({ sport: 'basketball' });
    
    if (!configurationsResult.success) {
      throw new Error(`Failed to list configurations: ${configurationsResult.error}`);
    }
    
    console.log(`Found ${configurationsResult.configurations.length} basketball configurations in database`);
    console.log('');
    
    console.log('===== TEST COMPLETED SUCCESSFULLY =====');
    
  } catch (error) {
    console.error('TEST FAILED:', error);
  }
}

/**
 * Count total games in a schedule
 * @param {Object} schedule - Schedule object
 * @returns {number} Total games
 */
function countGames(schedule) {
  return schedule.weeks.reduce((total, week) => total + week.matchups.length, 0);
}

// Run the test
runIntegrationTest(); 