// Redis Cache Service for historical metrics storage
// Uses standard Redis client for sparkline data caching

import { createClient } from 'redis';

// Redis client singleton
let redis = null;
let connectionPromise = null;

/**
 * Get or create Redis client connection
 * @returns {Promise<Object|null>} Redis client or null if connection fails
 */
async function getRedisClient() {
  if (redis && redis.isOpen) {
    return redis;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    try {
      const redisUrl = process.env.REDIS_URL || process.env.KV_URL;

      if (!redisUrl) {
        console.warn('Redis not configured: REDIS_URL environment variable missing');
        return null;
      }

      redis = createClient({ url: redisUrl });

      redis.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });

      redis.on('connect', () => {
        console.log('Redis connected successfully');
      });

      await redis.connect();
      return redis;
    } catch (error) {
      console.error('Failed to connect to Redis:', error.message);
      connectionPromise = null;
      return null;
    }
  })();

  return connectionPromise;
}

// Cache key patterns
const CACHE_KEYS = {
  // Historical quarter metrics (permanent - immutable data)
  historicalMetrics: (symbol, quarter) => `${symbol.toLowerCase()}:metrics:${quarter}`,

  // Current quarter metrics (6-hour TTL)
  currentMetrics: (symbol) => `${symbol.toLowerCase()}:metrics:current`,

  // Current insights (12-hour TTL)
  currentInsights: (symbol) => `${symbol.toLowerCase()}:insights:current`,

  // Sparkline data (assembled from historical + current)
  sparklineData: (symbol) => `${symbol.toLowerCase()}:sparklines`,

  // Filing metadata
  filingMetadata: (symbol, accession) => `${symbol.toLowerCase()}:filing:${accession}`
};

// TTL values in seconds
const TTL = {
  CURRENT_METRICS: 6 * 60 * 60,       // 6 hours
  CURRENT_INSIGHTS: 12 * 60 * 60,     // 12 hours
  SPARKLINE_CACHE: 60 * 60,           // 1 hour (assembled data)
  FILING_METADATA: 24 * 60 * 60 * 365 // 1 year (effectively permanent)
};

/**
 * Store historical quarter metrics (permanent cache)
 * @param {string} symbol - Stock ticker
 * @param {string} quarter - Quarter identifier (e.g., "2024-Q1")
 * @param {Object} metrics - Extracted metrics data
 * @returns {Promise<boolean>} - Success status
 */
export async function cacheHistoricalMetrics(symbol, quarter, metrics) {
  try {
    const client = await getRedisClient();
    if (!client) return false;

    const key = CACHE_KEYS.historicalMetrics(symbol, quarter);
    const data = {
      ...metrics,
      cachedAt: new Date().toISOString(),
      quarter,
      symbol: symbol.toUpperCase()
    };

    // No TTL for historical data - it's immutable
    await client.set(key, JSON.stringify(data));
    console.log(`Cached historical metrics for ${symbol} ${quarter}`);
    return true;
  } catch (error) {
    console.error(`Failed to cache historical metrics: ${error.message}`);
    return false;
  }
}

/**
 * Get historical quarter metrics from cache
 * @param {string} symbol - Stock ticker
 * @param {string} quarter - Quarter identifier
 * @returns {Promise<Object|null>} - Cached metrics or null
 */
export async function getHistoricalMetrics(symbol, quarter) {
  try {
    const client = await getRedisClient();
    if (!client) return null;

    const key = CACHE_KEYS.historicalMetrics(symbol, quarter);
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Failed to get historical metrics: ${error.message}`);
    return null;
  }
}

/**
 * Store current quarter metrics (with TTL)
 * @param {string} symbol - Stock ticker
 * @param {Object} metrics - Current quarter metrics
 * @returns {Promise<boolean>} - Success status
 */
export async function cacheCurrentMetrics(symbol, metrics) {
  try {
    const client = await getRedisClient();
    if (!client) return false;

    const key = CACHE_KEYS.currentMetrics(symbol);
    const data = {
      ...metrics,
      cachedAt: new Date().toISOString(),
      symbol: symbol.toUpperCase()
    };

    await client.setEx(key, TTL.CURRENT_METRICS, JSON.stringify(data));
    console.log(`Cached current metrics for ${symbol} (TTL: ${TTL.CURRENT_METRICS}s)`);
    return true;
  } catch (error) {
    console.error(`Failed to cache current metrics: ${error.message}`);
    return false;
  }
}

/**
 * Get current quarter metrics from cache
 * @param {string} symbol - Stock ticker
 * @returns {Promise<Object|null>} - Cached metrics or null
 */
export async function getCurrentMetrics(symbol) {
  try {
    const client = await getRedisClient();
    if (!client) return null;

    const key = CACHE_KEYS.currentMetrics(symbol);
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Failed to get current metrics: ${error.message}`);
    return null;
  }
}

/**
 * Store current insights (with TTL)
 * @param {string} symbol - Stock ticker
 * @param {Object} insights - Current insights data
 * @returns {Promise<boolean>} - Success status
 */
export async function cacheCurrentInsights(symbol, insights) {
  try {
    const client = await getRedisClient();
    if (!client) return false;

    const key = CACHE_KEYS.currentInsights(symbol);
    const data = {
      ...insights,
      cachedAt: new Date().toISOString(),
      symbol: symbol.toUpperCase()
    };

    await client.setEx(key, TTL.CURRENT_INSIGHTS, JSON.stringify(data));
    console.log(`Cached current insights for ${symbol} (TTL: ${TTL.CURRENT_INSIGHTS}s)`);
    return true;
  } catch (error) {
    console.error(`Failed to cache current insights: ${error.message}`);
    return false;
  }
}

/**
 * Get current insights from cache
 * @param {string} symbol - Stock ticker
 * @returns {Promise<Object|null>} - Cached insights or null
 */
export async function getCurrentInsights(symbol) {
  try {
    const client = await getRedisClient();
    if (!client) return null;

    const key = CACHE_KEYS.currentInsights(symbol);
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Failed to get current insights: ${error.message}`);
    return null;
  }
}

/**
 * Get all historical quarters for sparkline generation
 * @param {string} symbol - Stock ticker
 * @param {number} numQuarters - Number of quarters to fetch (default 8)
 * @returns {Promise<Array>} - Array of quarterly metrics sorted by date
 */
export async function getSparklineData(symbol, numQuarters = 8) {
  try {
    const client = await getRedisClient();
    if (!client) return [];

    // Generate quarter keys for the last N quarters
    const quarters = generateQuarterKeys(numQuarters);

    // Fetch all quarters in parallel
    const promises = quarters.map(q => getHistoricalMetrics(symbol, q));
    const results = await Promise.all(promises);

    // Filter out nulls and sort by quarter
    const validResults = results
      .filter(r => r !== null)
      .sort((a, b) => a.quarter.localeCompare(b.quarter));

    return validResults;
  } catch (error) {
    console.error(`Failed to get sparkline data: ${error.message}`);
    return [];
  }
}

/**
 * Generate quarter keys for the last N quarters
 * @param {number} numQuarters - Number of quarters
 * @returns {Array<string>} - Array of quarter identifiers
 */
function generateQuarterKeys(numQuarters) {
  const quarters = [];
  const now = new Date();
  let year = now.getFullYear();
  let quarter = Math.ceil((now.getMonth() + 1) / 3);

  for (let i = 0; i < numQuarters; i++) {
    quarters.unshift(`${year}-Q${quarter}`);
    quarter--;
    if (quarter === 0) {
      quarter = 4;
      year--;
    }
  }

  return quarters;
}

/**
 * Check if Redis is available and connected
 * @returns {Promise<boolean>} - Availability status
 */
export async function isRedisAvailable() {
  try {
    const client = await getRedisClient();
    if (!client) return false;

    // Try a ping operation
    await client.ping();
    return true;
  } catch (error) {
    console.log('Redis not available:', error.message);
    return false;
  }
}

/**
 * Get cache statistics for debugging
 * @param {string} symbol - Stock ticker
 * @returns {Promise<Object>} - Cache statistics
 */
export async function getCacheStats(symbol) {
  try {
    const client = await getRedisClient();
    if (!client) {
      return {
        error: 'Redis not connected',
        available: false
      };
    }

    const quarters = generateQuarterKeys(8);
    const historicalCount = (await Promise.all(
      quarters.map(async q => (await getHistoricalMetrics(symbol, q)) !== null ? 1 : 0)
    )).reduce((a, b) => a + b, 0);

    const currentMetrics = await getCurrentMetrics(symbol);

    return {
      symbol: symbol.toUpperCase(),
      historicalQuartersCached: historicalCount,
      totalQuarters: quarters.length,
      hasCurrentMetrics: currentMetrics !== null,
      quarters: quarters,
      available: true
    };
  } catch (error) {
    return {
      error: error.message,
      available: false
    };
  }
}

/**
 * Close Redis connection (for cleanup)
 */
export async function closeRedisConnection() {
  if (redis && redis.isOpen) {
    await redis.quit();
    redis = null;
    connectionPromise = null;
    console.log('Redis connection closed');
  }
}

export default {
  cacheHistoricalMetrics,
  getHistoricalMetrics,
  cacheCurrentMetrics,
  getCurrentMetrics,
  cacheCurrentInsights,
  getCurrentInsights,
  getSparklineData,
  isRedisAvailable,
  getCacheStats,
  closeRedisConnection,
  CACHE_KEYS,
  TTL
};
