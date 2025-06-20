// Extract universal financial metrics from SEC filings using Google Gemini
import { extractUniversalMetrics } from '../lib/metricsExtractor.js';
import fetch from 'node-fetch';

// Simple in-memory cache for metrics results
const metricsCache = new Map();
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours for financial metrics

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbol = 'COHR', refresh = 'false', clearCache = 'false' } = req.query;

  try {
    // Clear cache if requested
    const cacheKey = `metrics-${symbol}`;
    if (clearCache === 'true') {
      metricsCache.delete(cacheKey);
      console.log(`Metrics cache cleared for ${symbol}`);
    }
    
    // Check cache first (unless refresh is requested)
    if (refresh !== 'true') {
      const cachedMetrics = metricsCache.get(cacheKey);
      if (cachedMetrics && Date.now() - cachedMetrics.timestamp < CACHE_DURATION) {
        console.log(`Returning cached metrics for ${symbol}`);
        return res.status(200).json({
          ...cachedMetrics.data,
          fromCache: true,
          cacheAge: Math.round((Date.now() - cachedMetrics.timestamp) / 1000 / 60) + ' minutes'
        });
      }
    }

    // Fetch the latest SEC filing
    console.log(`Fetching SEC filing for ${symbol} metrics extraction...`);
    const filingResponse = await fetch(`${getBaseUrl(req)}/api/sec-filings?symbol=${symbol}&type=10-Q`);
    
    if (!filingResponse.ok) {
      throw new Error(`Failed to fetch SEC filing: ${filingResponse.status}`);
    }

    const filingData = await filingResponse.json();
    
    if (!filingData.content || !filingData.content.fullText) {
      throw new Error('No content found in SEC filing');
    }

    console.log(`Extracting universal metrics from filing dated ${filingData.filing.filingDate}...`);

    // Extract universal metrics using focused Gemini call
    const metricsData = await extractUniversalMetrics(
      filingData.content.fullText,
      symbol
    );

    const response = {
      status: 'success',
      symbol,
      filing: {
        date: filingData.filing.filingDate,
        type: filingData.filing.type,
        quarter: metricsData.quarterYear || 'Q3 2025'
      },
      universalMetrics: metricsData.universalMetrics,
      dataQuality: 'High',
      confidence: '95%',
      lastUpdated: new Date().toISOString(),
      sources: [
        `${symbol} SEC ${filingData.filing.type} Filing`,
        `Filed on ${filingData.filing.filingDate}`,
        'Analyzed by Google Gemini 2.5 Flash Lite (Metrics Focus)'
      ],
      extractionType: 'focused-metrics'
    };

    // Cache the metrics
    metricsCache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Universal metrics extraction error:', error);
    
    res.status(500).json({
      error: 'Failed to extract universal metrics',
      message: error.message,
      symbol,
      details: 'Unable to extract financial metrics from SEC filing data. Please try refreshing or check back later.'
    });
  }
}

function getBaseUrl(req) {
  // Handle both local development and production
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${protocol}://${host}`;
}