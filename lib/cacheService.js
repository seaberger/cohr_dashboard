// Redis Cache Service using Vercel KV (Upstash Redis)
// Provides permanent caching for historical metrics and temporary caching for current data

import { kv } from '@vercel/kv';

// Cache key patterns
const CACHE_KEYS = {
  // Historical quarter metrics (permanent - immutable data)
  historicalMetrics: (symbol, quarter) => `${symbol.toLowerCase()}:metrics:${quarter}`,

  // Current quarter metrics (6-hour TTL)
  currentMetrics: (symbol) => `${symbol.toLowerCase()}:metrics:current`,

  // Sparkline data (assembled from historical + current)
  sparklineData: (symbol) => `${symbol.toLowerCase()}:sparklines`,

  // Filing metadata
  filingMetadata: (symbol, accession) => `${symbol.toLowerCase()}:filing:${accession}`
};

// TTL values in seconds
const TTL = {
  CURRENT_METRICS: 6 * 60 * 60,      // 6 hours
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
    const key = CACHE_KEYS.historicalMetrics(symbol, quarter);
    const data = {
      ...metrics,
      cachedAt: new Date().toISOString(),
      quarter,
      symbol: symbol.toUpperCase()
    };

    // No TTL for historical data - it's immutable
    await kv.set(key, data);
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
    const key = CACHE_KEYS.historicalMetrics(symbol, quarter);
    const data = await kv.get(key);
    return data;
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
    const key = CACHE_KEYS.currentMetrics(symbol);
    const data = {
      ...metrics,
      cachedAt: new Date().toISOString(),
      symbol: symbol.toUpperCase()
    };

    await kv.set(key, data, { ex: TTL.CURRENT_METRICS });
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
    const key = CACHE_KEYS.currentMetrics(symbol);
    const data = await kv.get(key);
    return data;
  } catch (error) {
    console.error(`Failed to get current metrics: ${error.message}`);
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
 * Check if Redis/KV is available and configured
 * @returns {Promise<boolean>} - Availability status
 */
export async function isRedisAvailable() {
  try {
    // Try a simple ping operation
    await kv.ping();
    return true;
  } catch (error) {
    console.log('Redis/KV not available:', error.message);
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
      quarters: quarters
    };
  } catch (error) {
    return {
      error: error.message,
      available: false
    };
  }
}

export default {
  cacheHistoricalMetrics,
  getHistoricalMetrics,
  cacheCurrentMetrics,
  getCurrentMetrics,
  getSparklineData,
  isRedisAvailable,
  getCacheStats,
  CACHE_KEYS,
  TTL
};
