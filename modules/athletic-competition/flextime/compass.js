/**
 * FlexTime Scheduling Engine - COMPASS Module
 * 
 * Comprehensive Program Assessment Index (COMPASS)
 * Evaluates basketball programs across multiple dimensions with weighted components
 */

const winston = require('winston');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'flextime-compass' },
  transports: [
    new winston.transports.File({ filename: 'logs/flextime-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/flextime-combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ],
});

/**
 * Calculate COMPASS score for a program
 * @param {Object} programData - Program data for evaluation
 * @returns {Object} COMPASS evaluation results
 */
exports.calculateCompassScore = (programData) => {
  logger.info(`Calculating COMPASS score for program: ${programData.name}`);
  
  // Calculate component scores
  const onCourtScore = calculateOnCourtPerformance(programData);
  const rosterScore = calculateRosterDynamics(programData);
  const infrastructureScore = calculateProgramInfrastructure(programData);
  const prestigeScore = calculateProgramPrestige(programData);
  const academicScore = calculateAcademicFactors(programData);
  
  // Apply component weights
  const weightedScores = {
    onCourt: onCourtScore * 0.35,           // 35%
    roster: rosterScore * 0.25,             // 25%
    infrastructure: infrastructureScore * 0.20, // 20%
    prestige: prestigeScore * 0.15,         // 15%
    academic: academicScore * 0.05          // 5%
  };
  
  // Calculate total score
  const totalScore = Object.values(weightedScores).reduce((sum, score) => sum + score, 0);
  
  // Calculate confidence intervals
  const confidenceInterval = calculateConfidenceInterval(weightedScores);
  
  // Generate detailed component breakdown
  const componentBreakdown = {
    onCourtPerformance: {
      score: onCourtScore,
      weighted: weightedScores.onCourt,
      subcomponents: {
        currentSeasonAnalytics: {
          netRanking: 0, // Will be populated with actual data
          kenpomEfficiency: 0,
          strengthOfRecord: 0,
          gameScoreVariance: 0
        },
        winLossQuality: {
          conferenceRecord: 0,
          quadOneAndTwoVictories: 0,
          roadNeutralPerformance: 0
        },
        scoringMetrics: {
          marginOfVictory: 0,
          clutchPerformance: 0,
          scoringEfficiency: 0
        }
      }
    },
    rosterDynamics: {
      score: rosterScore,
      weighted: weightedScores.roster,
      subcomponents: {
        rosterContinuity: {
          returningProduction: 0,
          minutesContinuity: 0
        },
        talentAcquisition: {
          transferPortalValue: 0,
          recruitQuality: 0
        },
        talentDevelopment: {
          nbaDraftPotential: 0,
          playerImprovement: 0
        }
      }
    },
    programInfrastructure: {
      score: infrastructureScore,
      weighted: weightedScores.infrastructure,
      subcomponents: {
        coachingAssets: {
          headCoachSuccessRate: 0,
          staffStability: 0,
          tacticalAdaptability: 0
        },
        facilitiesResources: {
          practiceFacility: 0,
          arenaQuality: 0,
          technologyIntegration: 0
        },
        programSupport: {
          nilCollective: 0,
          financialCommitment: 0,
          medicalStaffQuality: 0
        }
      }
    },
    programPrestige: {
      score: prestigeScore,
      weighted: weightedScores.prestige,
      subcomponents: {
        historicalPerformance: {
          tournamentAppearances: 0,
          conferenceChampionships: 0,
          finalFours: 0
        },
        brandStrength: {
          socialMediaEngagement: 0,
          merchandiseSales: 0,
          nationalTvAppearances: 0
        },
        fanSupport: {
          attendanceFigures: 0,
          donorBaseStrength: 0
        }
      }
    },
    academicCultural: {
      score: academicScore,
      weighted: weightedScores.academic,
      subcomponents: {
        academicStanding: {
          institutionalReputation: 0,
          aprScores: 0
        },
        marketFactors: {
          mediaMarketSize: 0,
          regionalBasketballInterest: 0
        },
        campusEnvironment: {
          campusAtmosphere: 0,
          geographicRecruitingAdvantages: 0
        }
      }
    }
  };
  
  // Create and return the COMPASS evaluation
  const compassEvaluation = {
    programName: programData.name,
    totalScore: totalScore,
    confidenceInterval: confidenceInterval,
    weightedScores: weightedScores,
    componentBreakdown: componentBreakdown,
    evaluationDate: new Date()
  };
  
  logger.info(`COMPASS evaluation complete for ${programData.name}: ${totalScore.toFixed(2)}`);
  
  return compassEvaluation;
};

/**
 * Calculate On-Court Performance (35%)
 * @param {Object} programData - Program data
 * @returns {Number} Component score (0-100)
 */
function calculateOnCourtPerformance(programData) {
  // Extract relevant data from programData
  const { currentSeason, winLoss, scoring } = programData.performance || {};
  
  // Calculate Current Season Analytics (15% of 35%)
  const currentSeasonScore = calculateCurrentSeasonAnalytics(currentSeason);
  
  // Calculate Win-Loss Quality (12% of 35%)
  const winLossScore = calculateWinLossQuality(winLoss);
  
  // Calculate Scoring Metrics (8% of 35%)
  const scoringScore = calculateScoringMetrics(scoring);
  
  // Apply internal component weights
  // Current Season Analytics: 15/35 = 42.86% of component weight
  // Win-Loss Quality: 12/35 = 34.29% of component weight
  // Scoring Metrics: 8/35 = 22.86% of component weight
  const weightedScore = (
    (currentSeasonScore * 0.4286) +
    (winLossScore * 0.3429) +
    (scoringScore * 0.2286)
  );
  
  return weightedScore;
}

/**
 * Calculate Current Season Analytics (15% of total)
 * @param {Object} currentSeason - Current season data
 * @returns {Number} Subcomponent score (0-100)
 */
function calculateCurrentSeasonAnalytics(currentSeason = {}) {
  // Define weights within this subcomponent
  const weights = {
    netRanking: 0.333,       // 5% of total (5/15 of this component)
    kenpomEfficiency: 0.333, // 5% of total
    strengthOfRecord: 0.20,  // 3% of total
    gameScoreVariance: 0.133 // 2% of total
  };
  
  // Calculate metrics or use defaults if data not available
  const netRanking = calculateNetRankingScore(currentSeason.netRanking);
  const kenpomEfficiency = calculateKenpomScore(
    currentSeason.offensiveEfficiency,
    currentSeason.defensiveEfficiency
  );
  const strengthOfRecord = calculateStrengthOfRecordScore(currentSeason.strengthOfRecord);
  const gameScoreVariance = calculateGameScoreVarianceScore(currentSeason.gameScores);
  
  // Calculate weighted score
  const weightedScore = (
    (netRanking * weights.netRanking) +
    (kenpomEfficiency * weights.kenpomEfficiency) +
    (strengthOfRecord * weights.strengthOfRecord) +
    (gameScoreVariance * weights.gameScoreVariance)
  );
  
  return weightedScore;
}

/**
 * Calculate Win-Loss Quality (12% of total)
 * @param {Object} winLoss - Win-loss data
 * @returns {Number} Subcomponent score (0-100)
 */
function calculateWinLossQuality(winLoss = {}) {
  // Define weights within this subcomponent
  const weights = {
    conferenceRecord: 0.333,        // 4% of total (4/12 of this component)
    quadOneAndTwoVictories: 0.333,  // 4% of total
    roadNeutralPerformance: 0.333   // 4% of total
  };
  
  // Calculate metrics or use defaults if data not available
  const conferenceRecord = calculateConferenceRecordScore(
    winLoss.conferenceWins,
    winLoss.conferenceLosses
  );
  
  const quadOneAndTwoVictories = calculateQuadVictoriesScore(
    winLoss.quadOneWins,
    winLoss.quadTwoWins,
    winLoss.totalGames
  );
  
  const roadNeutralPerformance = calculateRoadNeutralScore(
    winLoss.roadWins,
    winLoss.roadLosses,
    winLoss.neutralWins,
    winLoss.neutralLosses
  );
  
  // Calculate weighted score
  const weightedScore = (
    (conferenceRecord * weights.conferenceRecord) +
    (quadOneAndTwoVictories * weights.quadOneAndTwoVictories) +
    (roadNeutralPerformance * weights.roadNeutralPerformance)
  );
  
  return weightedScore;
}

/**
 * Calculate Scoring Metrics (8% of total)
 * @param {Object} scoring - Scoring data
 * @returns {Number} Subcomponent score (0-100)
 */
function calculateScoringMetrics(scoring = {}) {
  // Define weights within this subcomponent
  const weights = {
    marginOfVictory: 0.50,       // 4% of total (4/8 of this component)
    clutchPerformance: 0.25,     // 2% of total
    scoringEfficiency: 0.25      // 2% of total
  };
  
  // Calculate metrics or use defaults if data not available
  const marginOfVictory = calculateMarginOfVictoryScore(scoring.averageMargin);
  const clutchPerformance = calculateClutchPerformanceScore(
    scoring.closeWins,
    scoring.closeLosses
  );
  const scoringEfficiency = calculateScoringEfficiencyScore(
    scoring.pointsPerPossession,
    scoring.pointsAllowedPerPossession
  );
  
  // Calculate weighted score
  const weightedScore = (
    (marginOfVictory * weights.marginOfVictory) +
    (clutchPerformance * weights.clutchPerformance) +
    (scoringEfficiency * weights.scoringEfficiency)
  );
  
  return weightedScore;
}

/**
 * Calculate NET Ranking score
 * @param {Number} netRanking - NET ranking (1-358)
 * @returns {Number} Normalized score (0-100)
 */
function calculateNetRankingScore(netRanking) {
  if (!netRanking) return 50; // Default if no data
  
  // NET Rankings typically range from 1-358 (all D1 teams)
  // Lower is better, so invert the scale
  // Top 10 teams should score 90+
  return normalizeMetric(359 - netRanking, 1, 358);
}

/**
 * Calculate KenPom efficiency score
 * @param {Number} offensiveEfficiency - Offensive efficiency rating
 * @param {Number} defensiveEfficiency - Defensive efficiency rating
 * @returns {Number} Normalized score (0-100)
 */
function calculateKenpomScore(offensiveEfficiency, defensiveEfficiency) {
  if (!offensiveEfficiency && !defensiveEfficiency) return 50; // Default if no data
  
  // KenPom metrics - typical ranges:
  // Great offensive efficiency: 115+ points per 100 possessions
  // Great defensive efficiency: below 95 points per 100 possessions
  
  const offensiveScore = offensiveEfficiency ? 
    normalizeMetric(offensiveEfficiency, 95, 125) : 50;
  
  const defensiveScore = defensiveEfficiency ? 
    normalizeMetric(125 - defensiveEfficiency, 95, 125) : 50;
  
  // Average of offensive and defensive efficiency
  return (offensiveScore + defensiveScore) / 2;
}

/**
 * Calculate Strength of Record score
 * @param {Number} strengthOfRecord - Strength of record ranking (1-358)
 * @returns {Number} Normalized score (0-100)
 */
function calculateStrengthOfRecordScore(strengthOfRecord) {
  if (!strengthOfRecord) return 50; // Default if no data
  
  // Strength of Record typically ranges from 1-358 (all D1 teams)
  // Lower is better, so invert the scale
  return normalizeMetric(359 - strengthOfRecord, 1, 358);
}

/**
 * Calculate Game Score Variance score
 * @param {Array} gameScores - Array of game scores
 * @returns {Number} Normalized score (0-100)
 */
function calculateGameScoreVarianceScore(gameScores) {
  if (!gameScores || !gameScores.length) return 50; // Default if no data
  
  // Calculate standard deviation of game margins
  const margins = gameScores.map(game => game.teamScore - game.opponentScore);
  const avgMargin = margins.reduce((sum, margin) => sum + margin, 0) / margins.length;
  
  const squaredDifferences = margins.map(margin => Math.pow(margin - avgMargin, 2));
  const variance = squaredDifferences.reduce((sum, sqDiff) => sum + sqDiff, 0) / margins.length;
  const stdDev = Math.sqrt(variance);
  
  // Lower variance is generally better (consistent performance)
  // A reasonable range for std dev is between 5-20 points
  // We invert the scale because lower variance is better
  return normalizeMetric(25 - stdDev, 5, 20);
}

/**
 * Calculate Conference Record score
 * @param {Number} wins - Conference wins
 * @param {Number} losses - Conference losses
 * @returns {Number} Normalized score (0-100)
 */
function calculateConferenceRecordScore(wins, losses) {
  if (!wins && !losses) return 50; // Default if no data
  wins = wins || 0;
  losses = losses || 0;
  
  // Calculate win percentage
  const totalGames = wins + losses;
  const winPercentage = totalGames > 0 ? (wins / totalGames) : 0;
  
  // Scale from 0-100
  // 50% win percentage should be around 50 points
  // 75% win percentage should be around 75 points
  // 100% win percentage should be 100 points
  return winPercentage * 100;
}

/**
 * Calculate Quad 1 & 2 Victories score
 * @param {Number} quadOneWins - Number of Quad 1 wins
 * @param {Number} quadTwoWins - Number of Quad 2 wins
 * @param {Number} totalGames - Total games played
 * @returns {Number} Normalized score (0-100)
 */
function calculateQuadVictoriesScore(quadOneWins, quadTwoWins, totalGames) {
  if (!quadOneWins && !quadTwoWins) return 50; // Default if no data
  quadOneWins = quadOneWins || 0;
  quadTwoWins = quadTwoWins || 0;
  totalGames = totalGames || 30; // Assume 30 games if not provided
  
  // Quad 1 wins are weighted more heavily than Quad 2
  const weightedWins = (quadOneWins * 1.5) + quadTwoWins;
  
  // Maximum expected top quality wins would be around 12-15
  // (equivalent to 8 Quad 1 wins and 6 Quad 2 wins)
  return normalizeMetric(weightedWins, 0, 18);
}

/**
 * Calculate Road & Neutral Site Performance score
 * @param {Number} roadWins - Road wins
 * @param {Number} roadLosses - Road losses
 * @param {Number} neutralWins - Neutral site wins
 * @param {Number} neutralLosses - Neutral site losses
 * @returns {Number} Normalized score (0-100)
 */
function calculateRoadNeutralScore(roadWins, roadLosses, neutralWins, neutralLosses) {
  if (!roadWins && !roadLosses && !neutralWins && !neutralLosses) return 50; // Default if no data
  
  roadWins = roadWins || 0;
  roadLosses = roadLosses || 0;
  neutralWins = neutralWins || 0;
  neutralLosses = neutralLosses || 0;
  
  // Road wins are slightly more valuable than neutral wins
  const roadWinPct = roadWins + roadLosses > 0 ? 
    roadWins / (roadWins + roadLosses) : 0;
  
  const neutralWinPct = neutralWins + neutralLosses > 0 ? 
    neutralWins / (neutralWins + neutralLosses) : 0;
  
  // Weight road performance higher than neutral site performance
  const combinedScore = (roadWinPct * 0.6) + (neutralWinPct * 0.4);
  
  return combinedScore * 100;
}

/**
 * Calculate Margin of Victory score
 * @param {Number} averageMargin - Average margin of victory
 * @returns {Number} Normalized score (0-100)
 */
function calculateMarginOfVictoryScore(averageMargin) {
  if (averageMargin === undefined || averageMargin === null) return 50; // Default if no data
  
  // A good team typically has a margin of +10 or better
  // An elite team might be +15 or better
  // Map the range -5 to +20 to the range 0-100
  return normalizeMetric(averageMargin, -5, 20);
}

/**
 * Calculate Clutch Performance score
 * @param {Number} closeWins - Number of close wins (within 5 points)
 * @param {Number} closeLosses - Number of close losses (within 5 points)
 * @returns {Number} Normalized score (0-100)
 */
function calculateClutchPerformanceScore(closeWins, closeLosses) {
  if (!closeWins && !closeLosses) return 50; // Default if no data
  
  closeWins = closeWins || 0;
  closeLosses = closeLosses || 0;
  
  const totalCloseGames = closeWins + closeLosses;
  
  // Calculate win percentage in close games
  const closeWinPct = totalCloseGames > 0 ? 
    closeWins / totalCloseGames : 0;
  
  // Scale from 0-100
  return closeWinPct * 100;
}

/**
 * Calculate Scoring Efficiency score
 * @param {Number} pointsPerPossession - Points per possession
 * @param {Number} pointsAllowedPerPossession - Points allowed per possession
 * @returns {Number} Normalized score (0-100)
 */
function calculateScoringEfficiencyScore(pointsPerPossession, pointsAllowedPerPossession) {
  if (!pointsPerPossession && !pointsAllowedPerPossession) return 50; // Default if no data
  
  pointsPerPossession = pointsPerPossession || 1.0;
  pointsAllowedPerPossession = pointsAllowedPerPossession || 1.0;
  
  // Calculate net points per possession
  const netPointsPerPossession = pointsPerPossession - pointsAllowedPerPossession;
  
  // An excellent team typically has a net efficiency of +0.15 or better
  // An elite team might be +0.25 or better
  // Map the range -0.10 to +0.30 to the range 0-100
  return normalizeMetric(netPointsPerPossession, -0.1, 0.3);
}

/**
 * Calculate Roster Dynamics (25%)
 * @param {Object} programData - Program data
 * @returns {Number} Component score (0-100)
 */
function calculateRosterDynamics(programData) {
  // Extract relevant data from programData
  const { continuity, acquisition, development } = programData.roster || {};
  
  // Calculate Roster Continuity (10% of 25%)
  const continuityScore = calculateRosterContinuity(continuity);
  
  // Calculate Talent Acquisition (10% of 25%)
  const acquisitionScore = calculateTalentAcquisition(acquisition);
  
  // Calculate Talent Development (5% of 25%)
  const developmentScore = calculateTalentDevelopment(development);
  
  // Apply internal component weights
  // Roster Continuity: 10/25 = 40% of component weight
  // Talent Acquisition: 10/25 = 40% of component weight
  // Talent Development: 5/25 = 20% of component weight
  const weightedScore = (
    (continuityScore * 0.40) +
    (acquisitionScore * 0.40) +
    (developmentScore * 0.20)
  );
  
  return weightedScore;
}

/**
 * Calculate Roster Continuity (10% of total)
 * @param {Object} continuity - Continuity data
 * @returns {Number} Subcomponent score (0-100)
 */
function calculateRosterContinuity(continuity = {}) {
  // Define weights within this subcomponent
  const weights = {
    returningProduction: 0.60, // 6% of total (6/10 of this component)
    minutesContinuity: 0.40    // 4% of total
  };
  
  // Calculate metrics or use defaults if data not available
  const returningProduction = calculateReturningProductionScore(
    continuity.returningPoints,
    continuity.returningRebounds,
    continuity.returningAssists,
    continuity.totalPoints,
    continuity.totalRebounds,
    continuity.totalAssists
  );
  
  const minutesContinuity = calculateMinutesContinuityScore(
    continuity.returningMinutes,
    continuity.totalMinutes
  );
  
  // Calculate weighted score
  const weightedScore = (
    (returningProduction * weights.returningProduction) +
    (minutesContinuity * weights.minutesContinuity)
  );
  
  return weightedScore;
}

/**
 * Calculate Talent Acquisition (10% of total)
 * @param {Object} acquisition - Talent acquisition data
 * @returns {Number} Subcomponent score (0-100)
 */
function calculateTalentAcquisition(acquisition = {}) {
  // Define weights within this subcomponent
  const weights = {
    transferPortalValue: 0.50, // 5% of total (5/10 of this component)
    recruitQuality: 0.50       // 5% of total
  };
  
  // Calculate metrics or use defaults if data not available
  const transferPortalValue = calculateTransferPortalScore(
    acquisition.incomingTransfers,
    acquisition.outgoingTransfers
  );
  
  const recruitQuality = calculateRecruitQualityScore(
    acquisition.recruitRankings,
    acquisition.totalRecruits
  );
  
  // Calculate weighted score
  const weightedScore = (
    (transferPortalValue * weights.transferPortalValue) +
    (recruitQuality * weights.recruitQuality)
  );
  
  return weightedScore;
}

/**
 * Calculate Talent Development (5% of total)
 * @param {Object} development - Talent development data
 * @returns {Number} Subcomponent score (0-100)
 */
function calculateTalentDevelopment(development = {}) {
  // Define weights within this subcomponent
  const weights = {
    nbaDraftPotential: 0.40,     // 2% of total (2/5 of this component)
    playerImprovement: 0.60      // 3% of total
  };
  
  // Calculate metrics or use defaults if data not available
  const nbaDraftPotential = calculateNbaDraftPotentialScore(
    development.draftProspects
  );
  
  const playerImprovement = calculatePlayerImprovementScore(
    development.yearOverYearImprovement
  );
  
  // Calculate weighted score
  const weightedScore = (
    (nbaDraftPotential * weights.nbaDraftPotential) +
    (playerImprovement * weights.playerImprovement)
  );
  
  return weightedScore;
}

/**
 * Calculate Returning Production score
 * @param {Number} returningPoints - Returning points
 * @param {Number} returningRebounds - Returning rebounds
 * @param {Number} returningAssists - Returning assists
 * @param {Number} totalPoints - Total points from previous season
 * @param {Number} totalRebounds - Total rebounds from previous season
 * @param {Number} totalAssists - Total assists from previous season
 * @returns {Number} Normalized score (0-100)
 */
function calculateReturningProductionScore(
  returningPoints, returningRebounds, returningAssists,
  totalPoints, totalRebounds, totalAssists
) {
  // Default values if data not available
  if (!returningPoints && !returningRebounds && !returningAssists) return 50;
  
  returningPoints = returningPoints || 0;
  returningRebounds = returningRebounds || 0;
  returningAssists = returningAssists || 0;
  totalPoints = totalPoints || 1;  // Avoid division by zero
  totalRebounds = totalRebounds || 1;
  totalAssists = totalAssists || 1;
  
  // Calculate percentages of returning production
  const pointsPct = returningPoints / totalPoints;
  const reboundsPct = returningRebounds / totalRebounds;
  const assistsPct = returningAssists / totalAssists;
  
  // Weight the different stats (points most important)
  const weightedPct = (pointsPct * 0.5) + (reboundsPct * 0.3) + (assistsPct * 0.2);
  
  // Scale from 0-100
  // 50% returning production should score around 50
  // 75% returning production should score around 75
  return weightedPct * 100;
}

/**
 * Calculate Minutes Continuity score
 * @param {Number} returningMinutes - Minutes played by returning players
 * @param {Number} totalMinutes - Total team minutes from previous season
 * @returns {Number} Normalized score (0-100)
 */
function calculateMinutesContinuityScore(returningMinutes, totalMinutes) {
  if (!returningMinutes || !totalMinutes) return 50; // Default if no data
  
  // Calculate percentage of returning minutes
  const minutesPct = totalMinutes > 0 ? 
    returningMinutes / totalMinutes : 0;
  
  // Scale from 0-100
  return minutesPct * 100;
}

/**
 * Calculate Transfer Portal Value score
 * @param {Array} incomingTransfers - Array of incoming transfers with ratings
 * @param {Array} outgoingTransfers - Array of outgoing transfers with ratings
 * @returns {Number} Normalized score (0-100)
 */
function calculateTransferPortalScore(incomingTransfers = [], outgoingTransfers = []) {
  if (!incomingTransfers.length && !outgoingTransfers.length) return 50; // Default if no data
  
  // Calculate average rating of incoming transfers
  const incomingRatings = incomingTransfers.map(transfer => transfer.rating || 0);
  const avgIncomingRating = incomingRatings.length > 0 ?
    incomingRatings.reduce((sum, rating) => sum + rating, 0) / incomingRatings.length : 0;
  
  // Calculate average rating of outgoing transfers
  const outgoingRatings = outgoingTransfers.map(transfer => transfer.rating || 0);
  const avgOutgoingRating = outgoingRatings.length > 0 ?
    outgoingRatings.reduce((sum, rating) => sum + rating, 0) / outgoingRatings.length : 0;
  
  // Consider both quality and quantity of transfers
  const incomingValue = avgIncomingRating * incomingRatings.length;
  const outgoingValue = avgOutgoingRating * outgoingRatings.length;
  
  // Calculate net transfer portal value
  // Positive means gained value, negative means lost value
  const netValue = incomingValue - outgoingValue;
  
  // Normalize to 0-100 scale
  // Range: -100 (lost a lot of value) to +100 (gained a lot of value)
  return normalizeMetric(netValue, -100, 100);
}

/**
 * Calculate Recruit Quality score
 * @param {Object} recruitRankings - Rankings of recruiting class
 * @param {Number} totalRecruits - Number of recruits
 * @returns {Number} Normalized score (0-100)
 */
function calculateRecruitQualityScore(recruitRankings = {}, totalRecruits = 0) {
  if (!recruitRankings) return 50; // Default if no data
  
  // Extract relevant rankings
  const nationalRanking = recruitRankings.national || 200; // Default to a poor ranking
  const conferenceRanking = recruitRankings.conference || 16; // Default to lower half of conference
  const starRating = recruitRankings.averageStars || 0;
  
  // Normalize each factor
  // National ranking: 1 is best, ~350 is worst
  const nationalScore = normalizeMetric(351 - nationalRanking, 1, 350);
  
  // Conference ranking: 1 is best, depends on conference size (assume max 16)
  const conferenceScore = normalizeMetric(17 - conferenceRanking, 1, 16);
  
  // Star rating: 5 is best, 0 is worst
  const starScore = normalizeMetric(starRating, 0, 5) * 20; // Scale to 0-100
  
  // Weighted average (national ranking matters most)
  return (nationalScore * 0.5) + (conferenceScore * 0.2) + (starScore * 0.3);
}

/**
 * Calculate NBA Draft Potential score
 * @param {Array} draftProspects - Array of players with draft potential
 * @returns {Number} Normalized score (0-100)
 */
function calculateNbaDraftPotentialScore(draftProspects = []) {
  if (!draftProspects.length) return 50; // Default if no data
  
  // Map each prospect to a numerical value based on projected draft position
  const prospectValues = draftProspects.map(prospect => {
    const projectedPick = prospect.projectedPick || 0;
    
    if (projectedPick === 0) return 0; // Not projected to be drafted
    if (projectedPick <= 14) return 100; // Lottery pick
    if (projectedPick <= 30) return 80; // First round
    if (projectedPick <= 60) return 60; // Second round
    return 40; // Fringe draft prospect
  });
  
  // Sum the values and cap at 100 (having multiple first-round picks is the ceiling)
  const totalValue = Math.min(100, prospectValues.reduce((sum, value) => sum + value, 0));
  
  // Scale based on total number of prospects
  // Having 1 lottery pick should score well (around 70-80)
  // Having multiple high picks should score near 100
  return Math.min(100, totalValue / Math.max(1, draftProspects.length) + 
    (prospectValues.length > 1 ? 20 : 0)); // Bonus for multiple prospects
}

/**
 * Calculate Player Improvement score
 * @param {Object} yearOverYearImprovement - Year-over-year improvement data
 * @returns {Number} Normalized score (0-100)
 */
function calculatePlayerImprovementScore(yearOverYearImprovement = {}) {
  if (!yearOverYearImprovement) return 50; // Default if no data
  
  // Extract improvement metrics
  const pointsImprovement = yearOverYearImprovement.points || 0;
  const efficiencyImprovement = yearOverYearImprovement.efficiency || 0;
  const defensiveImprovement = yearOverYearImprovement.defense || 0;
  
  // Normalize each improvement metric
  // Points: +3 points per player year-over-year is excellent
  const pointsScore = normalizeMetric(pointsImprovement, -1, 3);
  
  // Efficiency: +5% shooting percentage is excellent
  const efficiencyScore = normalizeMetric(efficiencyImprovement, -2, 5);
  
  // Defensive: Subjective scale, -10 to +10
  const defensiveScore = normalizeMetric(defensiveImprovement, -5, 5);
  
  // Weighted average (efficiency matters most for development)
  return (pointsScore * 0.3) + (efficiencyScore * 0.4) + (defensiveScore * 0.3);
}

/**
 * Calculate Program Infrastructure (20%)
 * @param {Object} programData - Program data
 * @returns {Number} Component score (0-100)
 */
function calculateProgramInfrastructure(programData) {
  // Placeholder for implementation
  return 75; // Mock score for now
}

/**
 * Calculate Program Prestige (15%)
 * @param {Object} programData - Program data
 * @returns {Number} Component score (0-100)
 */
function calculateProgramPrestige(programData) {
  // Placeholder for implementation
  return 80; // Mock score for now
}

/**
 * Calculate Academic & Cultural Factors (5%)
 * @param {Object} programData - Program data
 * @returns {Number} Component score (0-100)
 */
function calculateAcademicFactors(programData) {
  // Placeholder for implementation
  return 85; // Mock score for now
}

/**
 * Calculate confidence interval for COMPASS score
 * @param {Object} weightedScores - Weighted component scores
 * @returns {Object} Confidence interval with min and max values
 */
function calculateConfidenceInterval(weightedScores) {
  // Simple implementation that creates a confidence interval of ±5%
  const totalScore = Object.values(weightedScores).reduce((sum, score) => sum + score, 0);
  const margin = totalScore * 0.05;
  
  return {
    min: Math.max(0, totalScore - margin),
    max: Math.min(100, totalScore + margin)
  };
}

/**
 * Normalize a raw metric value to a 0-100 scale
 * @param {Number} value - Raw metric value
 * @param {Number} min - Expected minimum value
 * @param {Number} max - Expected maximum value
 * @returns {Number} Normalized value
 */
function normalizeMetric(value, min, max) {
  // Ensure the value is within bounds
  const boundedValue = Math.max(min, Math.min(max, value));
  
  // Normalize to 0-100 scale
  return ((boundedValue - min) / (max - min)) * 100;
}

/**
 * Compare COMPASS scores between programs
 * @param {Array} programs - Array of program COMPASS evaluations
 * @returns {Object} Comparative analysis
 */
exports.comparePrograms = (programs) => {
  logger.info(`Comparing ${programs.length} programs using COMPASS`);
  
  // Sort programs by total score
  const sortedPrograms = [...programs].sort((a, b) => b.totalScore - a.totalScore);
  
  // Calculate rankings
  const rankings = sortedPrograms.map((program, index) => ({
    rank: index + 1,
    programName: program.programName,
    totalScore: program.totalScore,
    strengthAreas: getTopComponents(program),
    weaknessAreas: getBottomComponents(program)
  }));
  
  // Calculate component averages across all programs
  const componentAverages = calculateComponentAverages(programs);
  
  return {
    rankings,
    componentAverages,
    date: new Date()
  };
};

/**
 * Get a program's top performing components
 * @param {Object} program - Program COMPASS evaluation
 * @returns {Array} Top components
 */
function getTopComponents(program) {
  const components = Object.entries(program.weightedScores)
    .map(([key, score]) => ({ key, score }))
    .sort((a, b) => b.score - a.score);
  
  return components.slice(0, 2).map(c => c.key);
}

/**
 * Get a program's weakest components
 * @param {Object} program - Program COMPASS evaluation
 * @returns {Array} Bottom components
 */
function getBottomComponents(program) {
  const components = Object.entries(program.weightedScores)
    .map(([key, score]) => ({ key, score }))
    .sort((a, b) => a.score - b.score);
  
  return components.slice(0, 2).map(c => c.key);
}

/**
 * Calculate average scores for each component across programs
 * @param {Array} programs - Array of program COMPASS evaluations
 * @returns {Object} Component averages
 */
function calculateComponentAverages(programs) {
  const averages = {
    onCourt: 0,
    roster: 0,
    infrastructure: 0,
    prestige: 0,
    academic: 0
  };
  
  // Sum all scores
  programs.forEach(program => {
    Object.keys(averages).forEach(key => {
      averages[key] += program.weightedScores[key];
    });
  });
  
  // Calculate averages
  const count = programs.length;
  Object.keys(averages).forEach(key => {
    averages[key] = count > 0 ? averages[key] / count : 0;
  });
  
  return averages;
} 