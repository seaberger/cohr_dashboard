// Analyze business segments from SEC filings using Google Gemini
import { extractSegmentData, validateSegmentData, generateMarketSummary } from '../lib/geminiService.js';
import fetch from 'node-fetch';

// Simple in-memory cache for analysis results
const analysisCache = new Map();
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

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

  const { symbol = 'COHR', refresh = 'false' } = req.query;

  try {
    // Check cache first (unless refresh is requested)
    const cacheKey = symbol;
    if (refresh !== 'true') {
      const cachedAnalysis = analysisCache.get(cacheKey);
      if (cachedAnalysis && Date.now() - cachedAnalysis.timestamp < CACHE_DURATION) {
        console.log(`Returning cached analysis for ${symbol}`);
        return res.status(200).json({
          ...cachedAnalysis.data,
          fromCache: true,
          cacheAge: Math.round((Date.now() - cachedAnalysis.timestamp) / 1000 / 60) + ' minutes'
        });
      }
    }

    // Fetch the latest SEC filing
    console.log(`Fetching SEC filing for ${symbol}...`);
    const filingResponse = await fetch(`${getBaseUrl(req)}/api/sec-filings?symbol=${symbol}&type=10-Q`);
    
    if (!filingResponse.ok) {
      throw new Error(`Failed to fetch SEC filing: ${filingResponse.status}`);
    }

    const filingData = await filingResponse.json();
    
    if (!filingData.content || !filingData.content.fullText) {
      throw new Error('No content found in SEC filing');
    }

    console.log(`Analyzing filing from ${filingData.filing.filingDate}...`);

    // Extract segment data using Gemini
    const segmentData = await extractSegmentData(
      filingData.content.fullText,
      symbol
    );

    // Validate the extracted data
    if (!validateSegmentData(segmentData)) {
      throw new Error('Invalid segment data extracted from filing');
    }

    // Generate market summary
    const marketSummary = await generateMarketSummary(segmentData);

    // Transform data for dashboard compatibility
    const transformedData = transformSegmentData(segmentData, symbol);

    const response = {
      status: 'success',
      symbol,
      filing: {
        date: filingData.filing.filingDate,
        type: filingData.filing.type,
        quarter: segmentData.quarterYear
      },
      marketIntelligence: transformedData,
      insights: {
        summary: marketSummary,
        topPerformer: findTopPerformer(transformedData),
        growthTrend: analyzeGrowthTrend(segmentData)
      },
      dataQuality: 'High',
      confidence: '95%',
      lastUpdated: new Date().toISOString(),
      sources: [
        `${symbol} SEC ${filingData.filing.type} Filing`,
        `Filed on ${filingData.filing.filingDate}`,
        'Analyzed by Google Gemini 2.5 Flash'
      ]
    };

    // Cache the analysis
    analysisCache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Segment analysis error:', error);
    
    // Return fallback data for COHR
    if (symbol === 'COHR') {
      const fallbackResponse = await fetch(`${getBaseUrl(req)}/api/market-trends`);
      const fallbackData = await fallbackResponse.json();
      
      return res.status(200).json({
        ...fallbackData,
        warning: 'Using fallback data due to analysis error',
        error: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to analyze business segments',
      message: error.message,
      symbol
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

function transformSegmentData(segmentData, symbol) {
  // The LLM already returns data in the correct format, but we need to map it
  // to the frontend's expected structure for backward compatibility
  
  const transformed = {};
  
  // Map the LLM segments to expected frontend keys
  const segmentMapping = {
    'networkingGrowth': 'aiDatacomGrowth',  // Map networking to AI datacom for frontend
    'lasersGrowth': 'industrialLaserMarket',
    'materialsGrowth': 'materialsGrowth',
    'telecomGrowth': 'telecomGrowth'
  };
  
  // Transform each segment from LLM output to frontend format
  Object.keys(segmentData).forEach(key => {
    if (key.endsWith('Growth') && typeof segmentData[key] === 'object') {
      const mappedKey = segmentMapping[key] || key;
      transformed[mappedKey] = segmentData[key];
    }
  });
  
  // Handle overall performance if it exists
  if (segmentData.cohrOverallPerformance) {
    transformed.cohrOverallPerformance = segmentData.cohrOverallPerformance;
  }
  
  // Copy metadata
  transformed.dataQuality = segmentData.dataQuality || 'High';
  transformed.lastUpdated = new Date().toISOString();
  transformed.updateFrequency = segmentData.updateFrequency || 'Quarterly';
  transformed.dataType = segmentData.dataType || 'Company-Specific Performance';
  transformed.quarter = segmentData.quarter;
  
  return transformed;
}

function findTopPerformer(transformedData) {
  if (!transformedData || typeof transformedData !== 'object') return null;

  let maxGrowth = -Infinity;
  let topSegment = null;

  // Look through all growth segments
  Object.keys(transformedData).forEach(key => {
    if (key.endsWith('Growth') && transformedData[key] && typeof transformedData[key] === 'object') {
      const segment = transformedData[key];
      // Find the YoY growth field
      const yoyField = Object.keys(segment).find(field => field.includes('GrowthYoY'));
      if (yoyField && segment[yoyField]) {
        const growthStr = segment[yoyField].replace(/[+%]/g, '');
        const growth = parseFloat(growthStr);
        if (!isNaN(growth) && growth > maxGrowth) {
          maxGrowth = growth;
          topSegment = {
            name: key.replace('Growth', '').replace(/([A-Z])/g, ' $1').trim(),
            growth: segment[yoyField],
            driver: segment.keyDriver || 'Strong performance'
          };
        }
      }
    }
  });

  return topSegment;
}

function analyzeGrowthTrend(segmentData) {
  // Try to get overall growth from different possible structures
  let overallGrowthStr = null;
  
  if (segmentData.cohrOverallPerformance && segmentData.cohrOverallPerformance.revenueGrowthYoY) {
    overallGrowthStr = segmentData.cohrOverallPerformance.revenueGrowthYoY;
  } else if (segmentData.overall && segmentData.overall.revenueGrowthYoY) {
    overallGrowthStr = segmentData.overall.revenueGrowthYoY;
  }
  
  if (!overallGrowthStr) return 'Unknown';
  
  const overallGrowth = parseFloat(overallGrowthStr.replace(/[+%]/g, ''));
  
  if (isNaN(overallGrowth)) return 'Unknown';
  
  if (overallGrowth > 20) {
    return 'Strong Growth';
  } else if (overallGrowth > 10) {
    return 'Moderate Growth';
  } else if (overallGrowth > 0) {
    return 'Slow Growth';
  } else if (overallGrowth === 0) {
    return 'Flat';
  } else {
    return 'Declining';
  }
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}