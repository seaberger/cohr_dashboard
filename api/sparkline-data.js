// Sparkline Data API - Returns historical metrics for sparkline visualization
// Fetches 8 quarters of real data from Redis cache

import {
  getSparklineData,
  getCurrentMetrics,
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

    // Get historical data from cache
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

    // Get current quarter if available
    const currentMetrics = await getCurrentMetrics(symbol);

    // Build sparkline arrays for each metric
    const sparklines = buildSparklineArrays(historicalData, currentMetrics, metric);

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
 */
function buildSparklineArrays(historicalData, currentMetrics, requestedMetric) {
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

    // Extract values from each quarter
    for (const quarter of historicalData) {
      const metricData = quarter.metrics?.[metricName];
      if (metricData && metricData.value !== null) {
        dataPoints.push(metricData.value);
        labels.push(quarter.quarter);
      }
    }

    // Add current quarter if available
    if (currentMetrics?.metrics?.[metricName]?.value !== null) {
      dataPoints.push(currentMetrics.metrics[metricName].value);
      labels.push('Current');
    }

    // Calculate trend
    const trend = calculateTrend(dataPoints);

    sparklines[metricName] = {
      data: dataPoints,
      labels,
      count: dataPoints.length,
      trend,
      min: Math.min(...dataPoints),
      max: Math.max(...dataPoints),
      latest: dataPoints[dataPoints.length - 1] || null,
      first: dataPoints[0] || null,
      change: dataPoints.length >= 2
        ? ((dataPoints[dataPoints.length - 1] - dataPoints[0]) / dataPoints[0] * 100).toFixed(1) + '%'
        : null
    };
  }

  return sparklines;
}

/**
 * Calculate trend direction from data points
 */
function calculateTrend(dataPoints) {
  if (dataPoints.length < 2) return 'neutral';

  const first = dataPoints[0];
  const last = dataPoints[dataPoints.length - 1];
  const changePercent = ((last - first) / first) * 100;

  if (changePercent > 5) return 'positive';
  if (changePercent < -5) return 'negative';
  return 'neutral';
}
