/**
 * NIL Valuation Controller
 * 
 * Handles API requests related to NIL valuations
 */

const NILValuation = require('../models/nilValuation');

// Get all NIL valuations
exports.getAllValuations = async (req, res) => {
  try {
    const valuations = await NILValuation.find().populate('playerId');
    res.status(200).json({
      success: true,
      count: valuations.length,
      data: valuations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Get single valuation
exports.getValuation = async (req, res) => {
  try {
    const valuation = await NILValuation.findById(req.params.id).populate('playerId');
    
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
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Get valuation by player ID
exports.getValuationByPlayer = async (req, res) => {
  try {
    const valuation = await NILValuation.findOne({ playerId: req.params.playerId }).populate('playerId');
    
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
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Create new valuation
exports.createValuation = async (req, res) => {
  try {
    const valuation = await NILValuation.create(req.body);
    
    res.status(201).json({
      success: true,
      data: valuation
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      
      return res.status(400).json({
        success: false,
        error: messages
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  }
};

// Update valuation
exports.updateValuation = async (req, res) => {
  try {
    const valuation = await NILValuation.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
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
    
    await valuation.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
}; 