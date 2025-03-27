/**
 * NIL Valuation Model
 * 
 * This model represents NIL (Name, Image, Likeness) valuation data for athletes.
 * Valuations are calculated internally rather than scraping data.
 */

const mongoose = require('mongoose');

const nilValuationSchema = new mongoose.Schema({
  playerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'TransferPlayer',
    required: true
  },
  marketValueEstimate: { type: Number },
  socialMediaMetrics: {
    twitter: {
      followers: { type: Number, default: 0 },
      engagement: { type: Number, default: 0 }
    },
    instagram: {
      followers: { type: Number, default: 0 },
      engagement: { type: Number, default: 0 }
    },
    tiktok: {
      followers: { type: Number, default: 0 },
      engagement: { type: Number, default: 0 }
    }
  },
  athleticPerformance: {
    rating: { type: Number },
    keyStats: { type: String }
  },
  marketability: {
    score: { type: Number },
    notes: { type: String }
  },
  valuationDate: { type: Date, default: Date.now },
  valuationMethod: { type: String, required: true },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('NILValuation', nilValuationSchema); 