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
  // Quarter metrics (permanent - used for both current and historical)
  quarterMetrics: (symbol, quarter) => `${symbol.toLowerCase()}:metrics:${quarter}`,

  // Quarter insights (permanent - used for both current and historical)
  quarterInsights: (symbol, quarter) => `${symbol.toLowerCase()}:insights:${quarter}`,

  // Latest processed filing tracker (permanent)
  latestFiling: (symbol, filingType) => `${symbol.toLowerCase()}:filing:latest-${filingType.toLowerCase()}`,

  // Legacy keys (for backwards compatibility during migration)
  historicalMetrics: (symbol, quarter) => `${symbol.toLowerCase()}:metrics:${quarter}`,
  currentMetrics: (symbol) => `${symbol.toLowerCase()}:metrics:current`,
  currentInsights: (symbol) => `${symbol.toLowerCase()}:insights:current`,

  // Sparkline data (assembled from historical + current)
  sparklineData: (symbol) => `${symbol.toLowerCase()}:sparklines`,

  // Filing metadata
  filingMetadata: (symbol, accession) => `${symbol.toLowerCase()}:filing:${accession}`,

  // Blog posts (company news)
  recentBlogs: (symbol) => `${symbol.toLowerCase()}:blogs:recent`
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
 * Track latest processed filing (for change detection)
 * @param {string} symbol - Stock ticker
 * @param {string} filingType - Filing type (e.g., "10-Q", "10-K")
 * @param {Object} metadata - Filing metadata { accessionNumber, filingDate, quarter }
 * @returns {Promise<boolean>} - Success status
 */
export async function setLatestFiling(symbol, filingType, metadata) {
  try {
    const client = await getRedisClient();
    if (!client) return false;

    const key = CACHE_KEYS.latestFiling(symbol, filingType);
    const data = {
      ...metadata,
      updatedAt: new Date().toISOString()
    };

    await client.set(key, JSON.stringify(data));
    console.log(`Updated latest ${filingType} filing tracker for ${symbol}: ${metadata.accessionNumber}`);
    return true;
  } catch (error) {
    console.error(`Failed to set latest filing: ${error.message}`);
    return false;
  }
}

/**
 * Get latest processed filing metadata
 * @param {string} symbol - Stock ticker
 * @param {string} filingType - Filing type (e.g., "10-Q", "10-K")
 * @returns {Promise<Object|null>} - Filing metadata or null
 */
export async function getLatestFiling(symbol, filingType) {
  try {
    const client = await getRedisClient();
    if (!client) return null;

    const key = CACHE_KEYS.latestFiling(symbol, filingType);
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Failed to get latest filing: ${error.message}`);
    return null;
  }
}

/**
 * Cache metrics by quarter (permanent - used for both current and historical)
 * @param {string} symbol - Stock ticker
 * @param {string} quarter - Quarter identifier (e.g., "2025-Q3")
 * @param {Object} metrics - Metrics data in unified format
 * @returns {Promise<boolean>} - Success status
 */
export async function cacheQuarterMetrics(symbol, quarter, metrics) {
  try {
    const client = await getRedisClient();
    if (!client) return false;

    const key = CACHE_KEYS.quarterMetrics(symbol, quarter);
    const data = {
      ...metrics,
      quarter,
      symbol: symbol.toUpperCase(),
      cachedAt: new Date().toISOString()
    };

    // No TTL - permanent storage for quarter data
    await client.set(key, JSON.stringify(data));
    console.log(`Cached quarter metrics for ${symbol} ${quarter}`);
    return true;
  } catch (error) {
    console.error(`Failed to cache quarter metrics: ${error.message}`);
    return false;
  }
}

/**
 * Get metrics for a specific quarter
 * @param {string} symbol - Stock ticker
 * @param {string} quarter - Quarter identifier (e.g., "2025-Q3")
 * @returns {Promise<Object|null>} - Metrics data or null
 */
export async function getQuarterMetrics(symbol, quarter) {
  try {
    const client = await getRedisClient();
    if (!client) return null;

    const key = CACHE_KEYS.quarterMetrics(symbol, quarter);
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Failed to get quarter metrics: ${error.message}`);
    return null;
  }
}

/**
 * Cache insights by quarter (permanent - used for both current and historical)
 * @param {string} symbol - Stock ticker
 * @param {string} quarter - Quarter identifier (e.g., "2025-Q3")
 * @param {Object} insights - Insights data
 * @returns {Promise<boolean>} - Success status
 */
export async function cacheQuarterInsights(symbol, quarter, insights) {
  try {
    const client = await getRedisClient();
    if (!client) return false;

    const key = CACHE_KEYS.quarterInsights(symbol, quarter);
    const data = {
      ...insights,
      quarter,
      symbol: symbol.toUpperCase(),
      cachedAt: new Date().toISOString()
    };

    // No TTL - permanent storage for quarter data
    await client.set(key, JSON.stringify(data));
    console.log(`Cached quarter insights for ${symbol} ${quarter}`);
    return true;
  } catch (error) {
    console.error(`Failed to cache quarter insights: ${error.message}`);
    return false;
  }
}

/**
 * Get insights for a specific quarter
 * @param {string} symbol - Stock ticker
 * @param {string} quarter - Quarter identifier (e.g., "2025-Q3")
 * @returns {Promise<Object|null>} - Insights data or null
 */
export async function getQuarterInsights(symbol, quarter) {
  try {
    const client = await getRedisClient();
    if (!client) return null;

    const key = CACHE_KEYS.quarterInsights(symbol, quarter);
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Failed to get quarter insights: ${error.message}`);
    return null;
  }
}

/**
 * Convert filing date to quarter identifier (YYYY-QX format)
 * @param {string} filingDate - Filing date string (e.g., "2025-11-05")
 * @returns {string} - Quarter identifier (e.g., "2025-Q3")
 */
export function filingDateToQuarter(filingDate) {
  const date = new Date(filingDate);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  // 10-Q filings are filed ~45 days after quarter end
  // Q1 (Jan-Mar) filed in May
  // Q2 (Apr-Jun) filed in Aug
  // Q3 (Jul-Sep) filed in Nov
  // Q4 is covered by 10-K annual report

  if (month >= 4 && month <= 6) return `${year}-Q1`;
  if (month >= 7 && month <= 9) return `${year}-Q2`;
  if (month >= 10 && month <= 12) return `${year}-Q3`;
  if (month >= 1 && month <= 3) return `${year - 1}-Q4`;

  return `${year}-Q${Math.ceil(month / 3)}`;
}

/**
 * Get recent blog posts from cache
 * @param {string} symbol - Stock ticker (default 'cohr')
 * @returns {Promise<Array|null>} - Array of blog posts or null
 */
export async function getRecentBlogs(symbol = 'cohr') {
  try {
    const client = await getRedisClient();
    if (!client) return null;

    const key = CACHE_KEYS.recentBlogs(symbol);
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Failed to get recent blogs: ${error.message}`);
    return null;
  }
}

/**
 * Store recent blog posts in cache
 * @param {string} symbol - Stock ticker (default 'cohr')
 * @param {Array} blogs - Array of slim blog post objects
 * @returns {Promise<boolean>} - Success status
 */
export async function cacheRecentBlogs(symbol = 'cohr', blogs) {
  try {
    const client = await getRedisClient();
    if (!client) return false;

    const key = CACHE_KEYS.recentBlogs(symbol);
    await client.set(key, JSON.stringify(blogs));
    console.log(`Cached ${blogs.length} recent blogs for ${symbol}`);
    return true;
  } catch (error) {
    console.error(`Failed to cache recent blogs: ${error.message}`);
    return false;
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
  // Historical metrics (backfill script)
  cacheHistoricalMetrics,
  getHistoricalMetrics,
  // Legacy current metrics (being replaced)
  cacheCurrentMetrics,
  getCurrentMetrics,
  cacheCurrentInsights,
  getCurrentInsights,
  // New quarter-based caching (unified format)
  cacheQuarterMetrics,
  getQuarterMetrics,
  cacheQuarterInsights,
  getQuarterInsights,
  // Filing change detection
  setLatestFiling,
  getLatestFiling,
  filingDateToQuarter,
  // Sparkline data
  getSparklineData,
  // Blog posts
  getRecentBlogs,
  cacheRecentBlogs,
  // Utilities
  isRedisAvailable,
  getCacheStats,
  closeRedisConnection,
  CACHE_KEYS,
  TTL
};
