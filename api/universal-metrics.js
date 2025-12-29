// Extract universal financial metrics from SEC filings using Google Gemini
// Uses filing change detection to avoid reprocessing same 10-Q
import { extractUniversalMetrics, normalizeToUnifiedFormat } from '../lib/metricsExtractor.js';
import fetch from 'node-fetch';
import {
  getLatestFiling,
  setLatestFiling,
  getQuarterMetrics,
  cacheQuarterMetrics,
  filingDateToQuarter,
  isRedisAvailable
} from '../lib/cacheService.js';

// Simple in-memory cache for metrics results (fallback when Redis unavailable)
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

  const { symbol = 'COHR', refresh = 'false', forceReprocess = 'false' } = req.query;

  // Set Vercel CDN cache headers
  if (refresh === 'true' || forceReprocess === 'true') {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  } else {
    // Cache at Vercel CDN for 6 hours, serve stale for 24hr while revalidating
    res.setHeader('Cache-Control', 'public, s-maxage=21600, stale-while-revalidate=86400');
  }

  try {
    // Step 1: Fetch latest filing metadata from SEC EDGAR (lightweight call)
    console.log(`Checking latest 10-Q filing for ${symbol}...`);
    const filingResponse = await fetch(`${getBaseUrl(req)}/api/sec-filings?symbol=${symbol}&type=10-Q&metadataOnly=true`);

    if (!filingResponse.ok) {
      throw new Error(`Failed to fetch SEC filing metadata: ${filingResponse.status}`);
    }

    const filingData = await filingResponse.json();
    const latestAccession = filingData.filing?.accessionNumber;
    const latestFilingDate = filingData.filing?.filingDate;

    if (!latestAccession) {
      throw new Error('No filing accession number available');
    }

    // Calculate quarter from filing date
    const currentQuarter = filingDateToQuarter(latestFilingDate);
    console.log(`Latest 10-Q: ${latestAccession} (${currentQuarter})`);

    // Step 2: Check if we've already processed this filing
    const lastProcessed = await getLatestFiling(symbol, '10-Q');
    const isNewFiling = forceReprocess === 'true' ||
      !lastProcessed ||
      lastProcessed.accessionNumber !== latestAccession;

    console.log(`Last processed: ${lastProcessed?.accessionNumber || 'none'}, isNewFiling: ${isNewFiling}`);

    // Step 3: Check for cached quarter data
    const cachedMetrics = await getQuarterMetrics(symbol, currentQuarter);

    if (cachedMetrics && !isNewFiling) {
      // Return cached data - no LLM call needed
      console.log(`Returning cached quarter metrics for ${symbol} ${currentQuarter}`);
      const cacheAge = Math.round((Date.now() - new Date(cachedMetrics.cachedAt).getTime()) / 1000 / 60);

      return res.status(200).json({
        ...formatResponse(cachedMetrics, symbol, filingData),
        fromCache: true,
        cacheType: 'quarter',
        cacheAge: cacheAge + ' minutes',
        filingStatus: 'unchanged'
      });
    }

    // Step 4: New filing detected - need to fetch full content and process
    console.log(`New 10-Q detected! Processing with Gemini...`);

    // Fetch full filing content
    const fullFilingResponse = await fetch(`${getBaseUrl(req)}/api/sec-filings?symbol=${symbol}&type=10-Q`);

    if (!fullFilingResponse.ok) {
      throw new Error(`Failed to fetch full SEC filing: ${fullFilingResponse.status}`);
    }

    const fullFilingData = await fullFilingResponse.json();

    if (!fullFilingData.content?.fullText) {
      throw new Error('No content found in SEC filing');
    }

    console.log(`Extracting metrics from filing dated ${latestFilingDate}...`);

    // Extract metrics using Gemini (with unified format)
    const rawMetrics = await extractUniversalMetrics(
      fullFilingData.content.fullText,
      symbol
    );

    // Normalize to unified format (numeric values + display strings)
    const normalizedMetrics = normalizeToUnifiedFormat(rawMetrics);

    // Build unified metrics object for storage
    const unifiedData = {
      quarter: currentQuarter,
      quarterDisplay: normalizedMetrics.quarterYear || `Q${currentQuarter.split('-Q')[1]} ${currentQuarter.split('-')[0]}`,
      filingDate: latestFilingDate,
      accessionNumber: latestAccession,
      symbol: symbol.toUpperCase(),
      extractedAt: new Date().toISOString(),
      model: 'gemini-2.5-flash-lite',
      metrics: normalizedMetrics.metrics || normalizedMetrics.universalMetrics
    };

    // Step 5: Cache the results by quarter (permanent)
    await cacheQuarterMetrics(symbol, currentQuarter, unifiedData);

    // Update filing tracker
    await setLatestFiling(symbol, '10-Q', {
      accessionNumber: latestAccession,
      filingDate: latestFilingDate,
      quarter: currentQuarter
    });

    console.log(`Cached new metrics for ${symbol} ${currentQuarter}`);

    // Also cache in memory as fallback
    const cacheKey = `metrics-${symbol}`;
    metricsCache.set(cacheKey, {
      data: unifiedData,
      timestamp: Date.now()
    });

    const response = formatResponse(unifiedData, symbol, fullFilingData);
    response.newFilingProcessed = true;
    response.filingStatus = 'new';

    res.status(200).json(response);

  } catch (error) {
    console.error('Universal metrics extraction error:', error);

    // Try returning cached data on error
    const lastProcessed = await getLatestFiling(symbol, '10-Q');
    if (lastProcessed?.quarter) {
      const cachedMetrics = await getQuarterMetrics(symbol, lastProcessed.quarter);
      if (cachedMetrics) {
        console.log(`Returning stale cached metrics after error`);
        return res.status(200).json({
          ...formatResponse(cachedMetrics, symbol, { filing: lastProcessed }),
          fromCache: true,
          cacheType: 'stale',
          error: error.message
        });
      }
    }

    res.status(500).json({
      error: 'Failed to extract universal metrics',
      message: error.message,
      symbol,
      details: 'Unable to extract financial metrics from SEC filing data. Please try refreshing or check back later.'
    });
  }
}

/**
 * Format response for API output (supports both old and new data formats)
 */
function formatResponse(data, symbol, filingData) {
  // Support both unified format (metrics) and legacy format (universalMetrics)
  const metrics = data.metrics || data.universalMetrics;
  const filingDate = data.filingDate || filingData?.filing?.filingDate;
  const accession = data.accessionNumber || filingData?.filing?.accessionNumber;
  const model = data.model || 'gemini-2.5-flash-lite';

  return {
    status: 'success',
    symbol: symbol.toUpperCase(),
    filing: {
      date: filingDate,
      type: filingData?.filing?.type || '10-Q',
      quarter: data.quarterDisplay || data.quarter,
      accessionNumber: accession
    },
    quarter: data.quarter,
    // Include metrics in BOTH formats for backward compatibility
    metrics: metrics,
    universalMetrics: metrics,
    lastUpdated: data.extractedAt || data.cachedAt || new Date().toISOString(),
    // Accurate source information
    extraction: {
      method: 'LLM Analysis',
      model: model,
      modelDisplay: model === 'gemini-3-flash-preview' ? 'Google Gemini 3 Flash' : 'Google Gemini 2.5 Flash Lite',
      source: 'SEC EDGAR',
      filingType: '10-Q',
      filingUrl: accession ? `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0000820318&type=10-Q&dateb=&owner=include&count=40&search_text=` : null
    },
    sources: [
      `SEC EDGAR 10-Q Filing (${filingDate})`,
      `Accession: ${accession}`,
      `Extracted by ${model === 'gemini-3-flash-preview' ? 'Google Gemini 3 Flash' : 'Google Gemini 2.5 Flash Lite'}`
    ],
    methodology: 'Financial metrics extracted directly from SEC 10-Q filing using LLM analysis. Values are parsed from Condensed Consolidated Financial Statements.',
    extractionType: 'unified-format'
  };
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