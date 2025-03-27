/**
 * NIL Valuation Controller
 * 
 * Handles API requests related to NIL valuations
 */

const NILValuation = require('../models/nilValuation');

// Get all NIL valuations
exports.getAllValuations = async (req, res) => {
  try {
    const valuations = await NILValuation.findAll();
    res.status(200).json({
      success: true,
      count: valuations.length,
      data: valuations
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Get single valuation
exports.getValuation = async (req, res) => {
  try {
    const valuation = await NILValuation.findById(req.params.id);
    
    if (!valuation) {
      return res.status(404).json({
        success: false,
        error: 'Valuation not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: valuation
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Get valuation by player ID
exports.getValuationByPlayer = async (req, res) => {
  try {
    const valuation = await NILValuation.findByPlayerId(req.params.playerId);
    
    if (!valuation) {
      return res.status(404).json({
        success: false,
        error: 'Valuation not found for this player'
      });
    }
    
    res.status(200).json({
      success: true,
      data: valuation
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Create new valuation
exports.createValuation = async (req, res) => {
  try {
    // Transform camelCase to snake_case for PostgreSQL
    const valuationData = {
      player_id: req.body.playerId,
      market_value_estimate: req.body.marketValueEstimate,
      
      // Social Media Metrics
      twitter_followers: req.body.socialMediaMetrics?.twitter?.followers || 0,
      twitter_engagement: req.body.socialMediaMetrics?.twitter?.engagement || 0,
      instagram_followers: req.body.socialMediaMetrics?.instagram?.followers || 0,
      instagram_engagement: req.body.socialMediaMetrics?.instagram?.engagement || 0,
      tiktok_followers: req.body.socialMediaMetrics?.tiktok?.followers || 0,
      tiktok_engagement: req.body.socialMediaMetrics?.tiktok?.engagement || 0,
      
      // Athletic Performance
      athletic_performance_rating: req.body.athleticPerformance?.rating,
      key_stats: req.body.athleticPerformance?.keyStats,
      
      // Marketability
      marketability_score: req.body.marketability?.score,
      marketability_notes: req.body.marketability?.notes,
      
      valuation_date: req.body.valuationDate || new Date(),
      valuation_method: req.body.valuationMethod
    };
    
    const result = await NILValuation.create(valuationData);
    const newValuation = result[0]; // Knex returns an array with the inserted object
    
    res.status(201).json({
      success: true,
      data: newValuation
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Update valuation
exports.updateValuation = async (req, res) => {
  try {
    // Transform camelCase to snake_case for PostgreSQL
    const valuationData = {};
    
    if (req.body.playerId) valuationData.player_id = req.body.playerId;
    if (req.body.marketValueEstimate) valuationData.market_value_estimate = req.body.marketValueEstimate;
    
    // Social Media Metrics
    if (req.body.socialMediaMetrics?.twitter?.followers) valuationData.twitter_followers = req.body.socialMediaMetrics.twitter.followers;
    if (req.body.socialMediaMetrics?.twitter?.engagement) valuationData.twitter_engagement = req.body.socialMediaMetrics.twitter.engagement;
    if (req.body.socialMediaMetrics?.instagram?.followers) valuationData.instagram_followers = req.body.socialMediaMetrics.instagram.followers;
    if (req.body.socialMediaMetrics?.instagram?.engagement) valuationData.instagram_engagement = req.body.socialMediaMetrics.instagram.engagement;
    if (req.body.socialMediaMetrics?.tiktok?.followers) valuationData.tiktok_followers = req.body.socialMediaMetrics.tiktok.followers;
    if (req.body.socialMediaMetrics?.tiktok?.engagement) valuationData.tiktok_engagement = req.body.socialMediaMetrics.tiktok.engagement;
    
    // Athletic Performance
    if (req.body.athleticPerformance?.rating) valuationData.athletic_performance_rating = req.body.athleticPerformance.rating;
    if (req.body.athleticPerformance?.keyStats) valuationData.key_stats = req.body.athleticPerformance.keyStats;
    
    // Marketability
    if (req.body.marketability?.score) valuationData.marketability_score = req.body.marketability.score;
    if (req.body.marketability?.notes) valuationData.marketability_notes = req.body.marketability.notes;
    
    if (req.body.valuationDate) valuationData.valuation_date = req.body.valuationDate;
    if (req.body.valuationMethod) valuationData.valuation_method = req.body.valuationMethod;
    
    const result = await NILValuation.update(req.params.id, valuationData);
    
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Valuation not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Delete valuation
exports.deleteValuation = async (req, res) => {
  try {
    const valuation = await NILValuation.findById(req.params.id);
    
    if (!valuation) {
      return res.status(404).json({
        success: false,
        error: 'Valuation not found'
      });
    }
    
    await NILValuation.remove(req.params.id);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
}; 