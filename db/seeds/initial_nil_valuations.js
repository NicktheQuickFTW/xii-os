/**
 * Seed data for nil_valuations table
 * 
 * Note: This assumes the initial_players.js seed has been run first and 
 * that the player IDs match the ones in that seed.
 */

exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('nil_valuations').del();
  
  // Get player IDs for reference
  const players = await knex('players').select('id', 'name');
  const playerMap = players.reduce((map, player) => {
    map[player.name] = player.id;
    return map;
  }, {});
  
  // Insert seed data
  await knex('nil_valuations').insert([
    {
      player_id: playerMap['Archie Manning Jr.'],
      market_value_estimate: 250000,
      
      // Social Media Metrics
      twitter_followers: 150000,
      twitter_engagement: 4.5,
      instagram_followers: 200000,
      instagram_engagement: 5.2,
      tiktok_followers: 300000,
      tiktok_engagement: 7.8,
      
      // Athletic Performance
      athletic_performance_rating: 8.7,
      key_stats: 'Passed for 3,200 yards and 28 TDs with only 5 INTs last season',
      
      // Marketability
      marketability_score: 9.2,
      marketability_notes: 'Strong family name recognition and charismatic personality',
      
      valuation_date: new Date('2025-01-20'),
      valuation_method: 'Comprehensive Analysis'
    },
    {
      player_id: playerMap['Tyrone Williams'],
      market_value_estimate: 175000,
      
      // Social Media Metrics
      twitter_followers: 90000,
      twitter_engagement: 3.8,
      instagram_followers: 130000,
      instagram_engagement: 4.1,
      tiktok_followers: 180000,
      tiktok_engagement: 5.3,
      
      // Athletic Performance
      athletic_performance_rating: 8.3,
      key_stats: '85 receptions for 1,200 yards and 12 TDs last season',
      
      // Marketability
      marketability_score: 7.9,
      marketability_notes: 'Good presence in regional markets, especially Texas',
      
      valuation_date: new Date('2025-01-18'),
      valuation_method: 'Market Comparison'
    },
    {
      player_id: playerMap['Marcus Johnson'],
      market_value_estimate: 125000,
      
      // Social Media Metrics
      twitter_followers: 70000,
      twitter_engagement: 3.2,
      instagram_followers: 95000,
      instagram_engagement: 3.8,
      tiktok_followers: 120000,
      tiktok_engagement: 4.7,
      
      // Athletic Performance
      athletic_performance_rating: 8.1,
      key_stats: '1,150 rushing yards with 4.8 YPC and 9 TDs last season',
      
      // Marketability
      marketability_score: 6.8,
      marketability_notes: 'Growing popularity in Dallas area',
      
      valuation_date: new Date('2025-01-25'),
      valuation_method: 'Performance Metrics'
    }
  ]);
}; 