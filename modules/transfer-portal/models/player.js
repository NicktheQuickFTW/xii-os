/**
 * Transfer Portal Player Model
 * 
 * This model represents transfer portal players and their associated data.
 * Data is designed to be manually entered rather than scraped to comply with
 * ON3's Terms of Service.
 */

const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  position: { type: String, required: true },
  previousSchool: { type: String, required: true },
  eligibility: { type: String, required: true },
  height: { type: String },
  weight: { type: String },
  hometown: { type: String },
  status: { 
    type: String, 
    enum: ['Entered', 'Committed', 'Withdrawn'],
    required: true 
  },
  enteredDate: { type: Date },
  nilValue: { type: Number },
  notes: { type: String },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TransferPlayer', playerSchema); 