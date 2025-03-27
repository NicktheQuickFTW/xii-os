/**
 * Transfer Portal Player Controller
 * 
 * Handles API requests related to transfer portal players
 */

const Player = require('../models/player');

// Get all transfer portal players
exports.getAllPlayers = async (req, res) => {
  try {
    const players = await Player.findAll();
    res.status(200).json({
      success: true,
      count: players.length,
      data: players
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Get single player
exports.getPlayer = async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    
    if (!player) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: player
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Create new player
exports.createPlayer = async (req, res) => {
  try {
    // Transform camelCase to snake_case for PostgreSQL
    const playerData = {
      name: req.body.name,
      position: req.body.position,
      previous_school: req.body.previousSchool,
      eligibility: req.body.eligibility,
      height: req.body.height,
      weight: req.body.weight,
      hometown: req.body.hometown,
      status: req.body.status,
      entered_date: req.body.enteredDate,
      nil_value: req.body.nilValue,
      notes: req.body.notes
    };
    
    const result = await Player.create(playerData);
    const newPlayer = result[0]; // Knex returns an array with the inserted object
    
    res.status(201).json({
      success: true,
      data: newPlayer
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Update player
exports.updatePlayer = async (req, res) => {
  try {
    // Transform camelCase to snake_case for PostgreSQL
    const playerData = {};
    
    if (req.body.name) playerData.name = req.body.name;
    if (req.body.position) playerData.position = req.body.position;
    if (req.body.previousSchool) playerData.previous_school = req.body.previousSchool;
    if (req.body.eligibility) playerData.eligibility = req.body.eligibility;
    if (req.body.height) playerData.height = req.body.height;
    if (req.body.weight) playerData.weight = req.body.weight;
    if (req.body.hometown) playerData.hometown = req.body.hometown;
    if (req.body.status) playerData.status = req.body.status;
    if (req.body.enteredDate) playerData.entered_date = req.body.enteredDate;
    if (req.body.nilValue) playerData.nil_value = req.body.nilValue;
    if (req.body.notes) playerData.notes = req.body.notes;
    
    const result = await Player.update(req.params.id, playerData);
    
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
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

// Delete player
exports.deletePlayer = async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    
    if (!player) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }
    
    await Player.remove(req.params.id);
    
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