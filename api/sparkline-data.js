// Sparkline Data API - Returns historical metrics for sparkline visualization
// Fetches 8 quarters of real data from Redis cache using unified format

import {
  getSparklineData,
  getLatestFiling,
  getQuarterMetrics,
  isRedisAvailable,
  getCacheStats
} from '../lib/cacheService.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbol = 'COHR', metric = 'all' } = req.query;

  // Cache sparkline responses for 1 hour at CDN level
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');

  try {
    // Check if Redis is available
    const redisAvailable = await isRedisAvailable();

    if (!redisAvailable) {
      return res.status(503).json({
        error: 'Cache service unavailable',
        message: 'Historical data cache is not configured. Run backfill script first.',
        symbol,
        sparklines: null
      });
    }

    // Get cache stats
    const stats = await getCacheStats(symbol);

    // Get historical data from cache (backfilled quarters)
    const historicalData = await getSparklineData(symbol, 8);

    if (!historicalData || historicalData.length === 0) {
      return res.status(404).json({
        error: 'No historical data',
        message: `No cached historical metrics found for ${symbol}. Run backfill script.`,
        symbol,
        cacheStats: stats,
        sparklines: null
      });
    }

    // Get current quarter metrics (from unified format)
    // First check what the latest processed filing is
    const latestFiling = await getLatestFiling(symbol, '10-Q');
    let currentQuarterData = null;

    if (latestFiling?.quarter) {
      // Get current quarter data using unified format
      currentQuarterData = await getQuarterMetrics(symbol, latestFiling.quarter);
      console.log(`Current quarter ${latestFiling.quarter} data found: ${!!currentQuarterData}`);
    }

    // Build sparkline arrays for each metric
    const sparklines = buildSparklineArrays(historicalData, currentQuarterData, metric);

    res.status(200).json({
      status: 'success',
      symbol: symbol.toUpperCase(),
      quartersAvailable: historicalData.length,
      quarters: historicalData.map(d => d.quarter),
      cacheStats: stats,
      sparklines,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Sparkline data API error:', error);
    res.status(500).json({
      error: 'Failed to fetch sparkline data',
      message: error.message,
      symbol
    });
  }
}

/**
 * Build sparkline arrays from historical data
 * Supports both unified format (numeric values) and legacy format (display strings)
 */
function buildSparklineArrays(historicalData, currentQuarterData, requestedMetric) {
  const metrics = [
    'revenue',
    'grossMarginPct',
    'operatingMarginPct',
    'operatingIncome',
    'operatingCashFlow',
    'rndRatioPct',
    'netIncome',
    'epsDiluted'
  ];

  // Filter to requested metric if specified
  const metricsToProcess = requestedMetric === 'all'
    ? metrics
    : metrics.filter(m => m === requestedMetric);

  const sparklines = {};

  for (const metricName of metricsToProcess) {
    const dataPoints = [];
    const labels = [];

    // Extract values from historical quarters (backfilled data)
    for (const quarter of historicalData) {
      const metricData = quarter.metrics?.[metricName];
      if (metricData && metricData.value !== null && metricData.value !== undefined) {
        // Value should be numeric from backfill script
        const numericValue = typeof metricData.value === 'number'
          ? metricData.value
          : parseDisplayValue(metricData.value);
        if (numericValue !== null) {
          dataPoints.push(numericValue);
          labels.push(quarter.quarter);
        }
      }
    }

    // Add current quarter if available and not already in historical data
    if (currentQuarterData?.metrics) {
      const currentMetric = currentQuarterData.metrics[metricName];
      const currentQuarter = currentQuarterData.quarter;

      // Only add if not already in labels (avoid duplicates)
      if (currentMetric && currentMetric.value != null && !labels.includes(currentQuarter)) {
        const numericValue = typeof currentMetric.value === 'number'
          ? currentMetric.value
          : parseDisplayValue(currentMetric.value);

        if (numericValue !== null) {
          dataPoints.push(numericValue);
          labels.push(currentQuarter);
        }
      }
    }

    // Calculate trend
    const trend = calculateTrend(dataPoints);

    sparklines[metricName] = {
      data: dataPoints,
      labels,
      count: dataPoints.length,
      trend,
      min: dataPoints.length > 0 ? Math.min(...dataPoints) : null,
      max: dataPoints.length > 0 ? Math.max(...dataPoints) : null,
      latest: dataPoints[dataPoints.length - 1] ?? null,
      first: dataPoints[0] ?? null,
      change: dataPoints.length >= 2
        ? ((dataPoints[dataPoints.length - 1] - dataPoints[0]) / Math.abs(dataPoints[0]) * 100).toFixed(1) + '%'
        : null
    };
  }

  return sparklines;
}

/**
 * Parse display value string to numeric value
 * Examples: "$1,581M" -> 1581, "37.0%" -> 37.0, "$1.19" -> 1.19, "-$0.29" -> -0.29
 */
function parseDisplayValue(displayStr) {
  if (typeof displayStr === 'number') return displayStr;
  if (typeof displayStr !== 'string') return null;

  // Remove currency symbols, commas, and whitespace
  let cleaned = displayStr.replace(/[$,\s]/g, '');

  // Handle negative values in parentheses: ($0.29) -> -0.29
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    cleaned = '-' + cleaned.slice(1, -1);
  }

  // Handle millions suffix (M)
  const millionMatch = cleaned.match(/^(-?[\d.]+)M$/i);
  if (millionMatch) {
    return parseFloat(millionMatch[1]);
  }

  // Handle billions suffix (B)
  const billionMatch = cleaned.match(/^(-?[\d.]+)B$/i);
  if (billionMatch) {
    return parseFloat(billionMatch[1]) * 1000;
  }

  // Handle percentages
  const percentMatch = cleaned.match(/^(-?[\d.]+)%$/);
  if (percentMatch) {
    return parseFloat(percentMatch[1]);
  }

  // Try parsing as plain number
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Calculate trend direction from data points
 */
function calculateTrend(dataPoints) {
  if (dataPoints.length < 2) return 'neutral';

  const first = dataPoints[0];
  const last = dataPoints[dataPoints.length - 1];
  const changePercent = ((last - first) / Math.abs(first)) * 100;

  if (changePercent > 5) return 'positive';
  if (changePercent < -5) return 'negative';
  return 'neutral';
}
