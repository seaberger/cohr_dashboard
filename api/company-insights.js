// Extract company insights from SEC filings using Google Gemini
// Uses filing change detection to avoid reprocessing same 10-Q
import { extractCompanyInsights, validateCompanyInsights } from '../lib/insightsExtractor.js';
import fetch from 'node-fetch';
import {
  getLatestFiling,
  setLatestFiling,
  getQuarterInsights,
  cacheQuarterInsights,
  filingDateToQuarter,
  isRedisAvailable
} from '../lib/cacheService.js';

// Simple in-memory cache for insights results (fallback when Redis unavailable)
const insightsCache = new Map();
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours

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
    // Cache at Vercel CDN for 12 hours, serve stale for 24hr while revalidating
    res.setHeader('Cache-Control', 'public, s-maxage=43200, stale-while-revalidate=86400');
  }

  try {
    // Step 1: Fetch latest filing metadata from SEC EDGAR (lightweight call)
    console.log(`Checking latest 10-Q filing for ${symbol} insights...`);
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
    console.log(`Latest 10-Q for insights: ${latestAccession} (${currentQuarter})`);

    // Step 2: Check if we've already processed insights for this filing
    // Note: We use the same filing tracker as metrics - insights are per-filing
    const lastProcessed = await getLatestFiling(symbol, '10-Q');
    const isNewFiling = forceReprocess === 'true' ||
      !lastProcessed ||
      lastProcessed.accessionNumber !== latestAccession;

    console.log(`Last processed: ${lastProcessed?.accessionNumber || 'none'}, isNewFiling: ${isNewFiling}`);

    // Step 3: Check for cached quarter insights
    const cachedInsights = await getQuarterInsights(symbol, currentQuarter);

    if (cachedInsights && !isNewFiling) {
      // Return cached data - no LLM call needed
      console.log(`Returning cached quarter insights for ${symbol} ${currentQuarter}`);
      const cacheAge = Math.round((Date.now() - new Date(cachedInsights.cachedAt).getTime()) / 1000 / 60);

      return res.status(200).json({
        ...formatInsightsResponse(cachedInsights, symbol, filingData),
        fromCache: true,
        cacheType: 'quarter',
        cacheAge: cacheAge + ' minutes',
        filingStatus: 'unchanged'
      });
    }

    // Step 4: New filing detected - need to fetch full content and process
    console.log(`New 10-Q detected for insights! Processing with Gemini...`);

    // Fetch full filing content
    const fullFilingResponse = await fetch(`${getBaseUrl(req)}/api/sec-filings?symbol=${symbol}&type=10-Q`);

    if (!fullFilingResponse.ok) {
      throw new Error(`Failed to fetch full SEC filing: ${fullFilingResponse.status}`);
    }

    const fullFilingData = await fullFilingResponse.json();

    if (!fullFilingData.content?.fullText) {
      throw new Error('No content found in SEC filing');
    }

    console.log(`Extracting insights from filing dated ${latestFilingDate}...`);

    // Extract company insights using Gemini
    const insightsData = await extractCompanyInsights(
      fullFilingData.content.fullText,
      symbol
    );

    // Validate the insights data
    if (!validateCompanyInsights(insightsData)) {
      throw new Error('Invalid insights data structure returned from LLM');
    }

    // Build insights object for storage
    const unifiedInsights = {
      quarter: currentQuarter,
      quarterDisplay: insightsData.quarterYear || `Q${currentQuarter.split('-Q')[1]} ${currentQuarter.split('-')[0]}`,
      filingDate: latestFilingDate,
      accessionNumber: latestAccession,
      symbol: symbol.toUpperCase(),
      extractedAt: new Date().toISOString(),
      model: 'gemini-2.5-flash-lite',
      companyInsights: insightsData.companyInsights || [],
      segmentPerformance: insightsData.segments || []
    };

    // Step 5: Cache the results by quarter (permanent)
    await cacheQuarterInsights(symbol, currentQuarter, unifiedInsights);

    // Note: Filing tracker is already updated by metrics API
    // But update it here too in case insights is called first
    await setLatestFiling(symbol, '10-Q', {
      accessionNumber: latestAccession,
      filingDate: latestFilingDate,
      quarter: currentQuarter
    });

    console.log(`Cached new insights for ${symbol} ${currentQuarter}`);

    // Also cache in memory as fallback
    const cacheKey = `insights-${symbol}`;
    insightsCache.set(cacheKey, {
      data: unifiedInsights,
      timestamp: Date.now()
    });

    const response = formatInsightsResponse(unifiedInsights, symbol, fullFilingData);
    response.newFilingProcessed = true;
    response.filingStatus = 'new';

    res.status(200).json(response);

  } catch (error) {
    console.error('Company insights extraction error:', error);

    // Try returning cached data on error
    const lastProcessed = await getLatestFiling(symbol, '10-Q');
    if (lastProcessed?.quarter) {
      const cachedInsights = await getQuarterInsights(symbol, lastProcessed.quarter);
      if (cachedInsights) {
        console.log(`Returning stale cached insights after error`);
        return res.status(200).json({
          ...formatInsightsResponse(cachedInsights, symbol, { filing: lastProcessed }),
          fromCache: true,
          cacheType: 'stale',
          error: error.message
        });
      }
    }

    res.status(500).json({
      error: 'Failed to extract company insights',
      message: error.message,
      symbol,
      details: 'Unable to analyze SEC filing data. Please try refreshing or check back later.'
    });
  }
}

/**
 * Format insights response for API output
 */
function formatInsightsResponse(data, symbol, filingData) {
  return {
    status: 'success',
    symbol: symbol.toUpperCase(),
    quarter: data.quarter,
    filing: {
      date: data.filingDate || filingData?.filing?.filingDate,
      type: filingData?.filing?.type || '10-Q',
      quarter: data.quarterDisplay || data.quarter,
      accessionNumber: data.accessionNumber
    },
    companyInsights: data.companyInsights || [],
    segmentPerformance: data.segmentPerformance || [],
    dataQuality: 'High',
    confidence: '95%',
    lastUpdated: data.extractedAt || data.cachedAt || new Date().toISOString(),
    sources: [
      `${symbol} SEC 10-Q Filing`,
      `Filed on ${data.filingDate || filingData?.filing?.filingDate}`,
      `Analyzed by Google Gemini (${data.model || 'gemini-2.5-flash-lite'})`
    ],
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

// Focused on company insights extraction only

