/**
 * Distance Matrix Service
 * 
 * Provides travel distance and time calculations between locations using the
 * Google Maps Distance Matrix API. Includes caching, batching, and fallbacks.
 */

const fetch = require('node-fetch');
const logger = require('../../../shared/utils/logger');

// Configuration
const CACHE_EXPIRATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
const BATCH_SIZE = 10; // Maximum origins/destinations per API call (API limit is 25 elements per request)
const RATE_LIMIT_DELAY = 1000; // 1 second between API calls to avoid hitting rate limits

class DistanceMatrixService {
  constructor() {
    this.cache = new Map();
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
    this.lastRequestTime = 0;
  }

  /**
   * Get travel distance and time between two points
   * @param {Object} origin - Origin point {lat, lng}
   * @param {Object} destination - Destination point {lat, lng}
   * @param {Object} options - Options { mode, units, avoidTolls, avoidHighways }
   * @returns {Promise<Object>} Distance and duration information
   */
  async getDistance(origin, destination, options = {}) {
    const cacheKey = this._createCacheKey(origin, destination, options);
    
    // Check cache first
    const cachedResult = this._getFromCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    try {
      // Calculate time elapsed since last request
      const now = Date.now();
      const timeElapsed = now - this.lastRequestTime;
      
      // Apply rate limiting
      if (timeElapsed < RATE_LIMIT_DELAY) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeElapsed));
      }
      
      // Prepare API request
      const queryParams = this._buildQueryParams([origin], [destination], options);
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?${queryParams}`;
      
      // Make API request
      this.lastRequestTime = Date.now();
      const response = await fetch(url);
      const data = await response.json();
      
      // Process and cache result
      if (data.status === 'OK' && data.rows[0].elements[0].status === 'OK') {
        const result = {
          distance: {
            value: data.rows[0].elements[0].distance.value, // meters
            text: data.rows[0].elements[0].distance.text
          },
          duration: {
            value: data.rows[0].elements[0].duration.value, // seconds
            text: data.rows[0].elements[0].duration.text
          },
          origin: data.origin_addresses[0],
          destination: data.destination_addresses[0]
        };
        
        // Cache result
        this._addToCache(cacheKey, result);
        
        return result;
      }
      
      // Handle API errors
      logger.warn('Distance Matrix API error', { 
        status: data.status, 
        elementStatus: data.rows?.[0]?.elements?.[0]?.status 
      });
      return this._getFallbackDistance(origin, destination);
      
    } catch (error) {
      logger.error('Error in Distance Matrix service', { error: error.message });
      return this._getFallbackDistance(origin, destination);
    }
  }
  
  /**
   * Get distances for multiple origin/destination pairs in batches
   * @param {Array} origins - Array of origin points [{lat, lng}, ...]
   * @param {Array} destinations - Array of destination points [{lat, lng}, ...]
   * @param {Object} options - Options { mode, units, avoidTolls, avoidHighways }
   * @returns {Promise<Array>} Array of distance and duration information
   */
  async getDistanceMatrix(origins, destinations, options = {}) {
    // Calculate all origin/destination pair combinations
    const pairs = [];
    for (let i = 0; i < origins.length; i++) {
      for (let j = 0; j < destinations.length; j++) {
        pairs.push({
          origin: origins[i],
          destination: destinations[j],
          options
        });
      }
    }
    
    // Process in batches to avoid exceeding API limits
    const results = [];
    for (let i = 0; i < pairs.length; i += BATCH_SIZE) {
      const batch = pairs.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(pair => this.getDistance(pair.origin, pair.destination, pair.options))
      );
      results.push(...batchResults);
    }
    
    return results;
  }
  
  /**
   * Create a cache key for storing API results
   * @private
   */
  _createCacheKey(origin, destination, options) {
    return JSON.stringify({
      origin,
      destination,
      mode: options.mode || 'driving',
      units: options.units || 'metric',
      avoidTolls: !!options.avoidTolls,
      avoidHighways: !!options.avoidHighways
    });
  }
  
  /**
   * Get a result from cache if available and not expired
   * @private
   */
  _getFromCache(key) {
    if (this.cache.has(key)) {
      const cacheEntry = this.cache.get(key);
      
      // Check if cache entry is still valid
      if (Date.now() - cacheEntry.timestamp < CACHE_EXPIRATION) {
        return cacheEntry.data;
      }
      
      // Remove expired entry
      this.cache.delete(key);
    }
    
    return null;
  }
  
  /**
   * Add a result to the cache
   * @private
   */
  _addToCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  /**
   * Build query parameters for the API request
   * @private
   */
  _buildQueryParams(origins, destinations, options) {
    // Format origins and destinations
    const originParam = origins
      .map(loc => `${loc.lat},${loc.lng}`)
      .join('|');
      
    const destParam = destinations
      .map(loc => `${loc.lat},${loc.lng}`)
      .join('|');
    
    // Build query parameters
    const params = new URLSearchParams({
      origins: originParam,
      destinations: destParam,
      mode: options.mode || 'driving',
      units: options.units || 'metric',
      key: this.apiKey
    });
    
    // Add optional parameters
    if (options.avoidTolls) params.append('avoid', 'tolls');
    if (options.avoidHighways) params.append('avoid', 'highways');
    
    return params.toString();
  }
  
  /**
   * Generate fallback distance calculation when API fails
   * @private
   */
  _getFallbackDistance(origin, destination) {
    // Calculate Euclidean distance (rough approximation)
    const R = 6371000; // Earth radius in meters
    const lat1 = origin.lat * Math.PI / 180;
    const lat2 = destination.lat * Math.PI / 180;
    const deltaLat = (destination.lat - origin.lat) * Math.PI / 180;
    const deltaLng = (destination.lng - origin.lng) * Math.PI / 180;
    
    // Haversine formula for distance calculation
    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    // Distance in meters
    const distance = R * c;
    
    // Roughly estimate duration (assuming 60 km/h average speed)
    const duration = distance / (60 * 1000 / 3600);
    
    // Format distance for display
    let distanceText;
    if (distance >= 1000) {
      distanceText = `${(distance/1000).toFixed(1)} km`;
    } else {
      distanceText = `${Math.round(distance)} m`;
    }
    
    // Format duration for display
    let durationText;
    if (duration >= 3600) {
      durationText = `${Math.floor(duration/3600)} hours ${Math.floor((duration%3600)/60)} mins`;
    } else {
      durationText = `${Math.ceil(duration/60)} mins`;
    }
    
    return {
      distance: {
        value: Math.round(distance),
        text: distanceText
      },
      duration: {
        value: Math.round(duration),
        text: durationText
      },
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      isFallback: true
    };
  }
}

module.exports = new DistanceMatrixService(); 