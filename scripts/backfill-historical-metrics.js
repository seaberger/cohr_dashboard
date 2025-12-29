#!/usr/bin/env node
/**
 * Historical Metrics Backfill Script
 *
 * This script analyzes past 10-Q filings to extract metrics for sparkline generation.
 * Uses a more capable model (Gemini Pro) for accuracy since this is a one-time operation
 * and the results are cached permanently.
 *
 * Usage:
 *   node scripts/backfill-historical-metrics.js [--symbol COHR] [--quarters 8] [--dry-run]
 *
 * Environment Variables Required:
 *   - GEMINI_API_KEY: Google Gemini API key
 *   - KV_REST_API_URL: Vercel KV REST API URL
 *   - KV_REST_API_TOKEN: Vercel KV REST API Token
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import fetch from 'node-fetch';
import { cacheHistoricalMetrics, isRedisAvailable, getCacheStats } from '../lib/cacheService.js';

// Configuration
const SEC_API_BASE = 'https://data.sec.gov';
const USER_AGENT = 'COHR-Dashboard/1.0 (sean.bergman.dev@gmail.com)';

// Use Gemini 3 Flash for historical backfill (excellent accuracy, cost-effective)
// See: https://ai.google.dev/gemini-api/docs/gemini-3
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-3-flash-preview',
  generationConfig: {
    temperature: 0.1, // Very low for consistent extraction
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 4096,
  },
});

// Known CIKs for reliability
const KNOWN_CIKS = {
  'COHR': '0000820318'
};

// Rate limiting for SEC API (10 requests per second max)
const SEC_RATE_LIMIT_MS = 150;
let lastSecRequest = 0;

async function rateLimitedFetch(url, options = {}) {
  const now = Date.now();
  const timeSinceLastRequest = now - lastSecRequest;
  if (timeSinceLastRequest < SEC_RATE_LIMIT_MS) {
    await new Promise(resolve => setTimeout(resolve, SEC_RATE_LIMIT_MS - timeSinceLastRequest));
  }
  lastSecRequest = Date.now();

  return fetch(url, {
    ...options,
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'application/json',
      ...options.headers
    }
  });
}

/**
 * Get list of 10-Q filings for a symbol
 */
async function get10QFilings(symbol, limit = 8) {
  const cik = KNOWN_CIKS[symbol.toUpperCase()];
  if (!cik) {
    throw new Error(`Unknown symbol: ${symbol}. Add CIK to KNOWN_CIKS.`);
  }

  const url = `${SEC_API_BASE}/submissions/CIK${cik}.json`;
  const response = await rateLimitedFetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch filings: ${response.status}`);
  }

  const data = await response.json();
  const recentFilings = data.filings.recent;

  const filings = [];
  for (let i = 0; i < recentFilings.form.length && filings.length < limit; i++) {
    if (recentFilings.form[i] === '10-Q') {
      filings.push({
        form: recentFilings.form[i],
        filingDate: recentFilings.filingDate[i],
        accessionNumber: recentFilings.accessionNumber[i],
        accessionNumberClean: recentFilings.accessionNumber[i].replace(/-/g, ''),
        primaryDocument: recentFilings.primaryDocument[i],
        cik: cik
      });
    }
  }

  return filings;
}

/**
 * Fetch filing content from SEC EDGAR
 */
async function getFilingContent(filing) {
  const cikForUrl = filing.cik.replace(/^0+/, '');
  const url = `https://www.sec.gov/Archives/edgar/data/${cikForUrl}/${filing.accessionNumberClean}/${filing.primaryDocument}`;

  console.log(`  Fetching: ${url}`);
  const response = await rateLimitedFetch(url, {
    headers: { 'Accept': 'text/html' }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch filing: ${response.status}`);
  }

  const html = await response.text();

  // Clean HTML to text
  const textContent = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-zA-Z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return textContent.substring(0, 300000); // Limit for LLM context
}

/**
 * Extract metrics from filing text using Gemini Pro
 */
async function extractMetrics(filingText, symbol, filingDate) {
  const prompt = `
You are a financial analyst expert. Extract GAAP-based financial metrics from this SEC 10-Q filing.

IMPORTANT: Extract ONLY the values explicitly stated in the filing. Do not calculate or estimate.

Return a JSON object with this exact structure:
{
  "quarterYear": "QX 20XX",
  "filingDate": "${filingDate}",
  "metrics": {
    "revenue": {
      "value": 1234,
      "unit": "millions",
      "display": "$1,234M"
    },
    "grossMarginPct": {
      "value": 35.0,
      "unit": "percent",
      "display": "35.0%"
    },
    "operatingMarginPct": {
      "value": 8.5,
      "unit": "percent",
      "display": "8.5%"
    },
    "operatingIncome": {
      "value": 105,
      "unit": "millions",
      "display": "$105M"
    },
    "operatingCashFlow": {
      "value": 150,
      "unit": "millions",
      "display": "$150M"
    },
    "rndRatioPct": {
      "value": 8.2,
      "unit": "percent",
      "display": "8.2%"
    },
    "netIncome": {
      "value": 75,
      "unit": "millions",
      "display": "$75M"
    },
    "epsDiluted": {
      "value": 0.50,
      "unit": "dollars",
      "display": "$0.50"
    }
  },
  "extractionNotes": "Any relevant notes about data quality or assumptions"
}

Extraction Rules:
1. Revenue: "Total revenues" from current quarter column in Condensed Consolidated Statements of Operations
2. Gross Margin %: Calculate (1 - COGS/Revenue) × 100 if not explicitly stated
3. Operating Margin %: Operating income / Total revenues × 100
4. Operating Income: From current quarter column in Operations statement
5. Operating Cash Flow: "Net cash provided by operating activities" from Cash Flow statement
6. R&D/Revenue %: R&D expenses / Total revenues × 100
7. Net Income: "Net income attributable to [Company]" from current quarter
8. Diluted EPS: "Earnings per share—diluted" from current quarter

If a value cannot be extracted, use null for value and "N/A" for display.

Filing content to analyze:
${filingText}
`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  // Extract JSON from response
  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/\{[\s\S]*\}/);

  if (jsonMatch) {
    const jsonStr = jsonMatch[1] || jsonMatch[0];
    return JSON.parse(jsonStr);
  }

  return JSON.parse(text);
}

/**
 * Convert filing date to quarter identifier
 */
function filingDateToQuarter(filingDate) {
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
 * Main backfill function
 */
async function backfillHistoricalMetrics(options = {}) {
  const {
    symbol = 'COHR',
    quarters = 8,
    dryRun = false
  } = options;

  console.log('\n=== Historical Metrics Backfill ===');
  console.log(`Symbol: ${symbol}`);
  console.log(`Quarters: ${quarters}`);
  console.log(`Dry Run: ${dryRun}`);
  console.log('');

  // Check Redis availability
  if (!dryRun) {
    const redisAvailable = await isRedisAvailable();
    if (!redisAvailable) {
      console.error('ERROR: Redis/Vercel KV not available. Set KV_REST_API_URL and KV_REST_API_TOKEN.');
      console.log('Switching to dry-run mode to show what would be extracted.');
      options.dryRun = true;
    }
  }

  // Get list of 10-Q filings
  console.log('Fetching list of 10-Q filings from SEC EDGAR...');
  const filings = await get10QFilings(symbol, quarters);
  console.log(`Found ${filings.length} 10-Q filings\n`);

  const results = [];

  for (let i = 0; i < filings.length; i++) {
    const filing = filings[i];
    const quarter = filingDateToQuarter(filing.filingDate);

    console.log(`[${i + 1}/${filings.length}] Processing ${quarter} (filed ${filing.filingDate})...`);

    try {
      // Fetch filing content
      const content = await getFilingContent(filing);
      console.log(`  Content length: ${content.length} chars`);

      // Extract metrics using Gemini Pro
      console.log('  Extracting metrics with Gemini Pro...');
      const extracted = await extractMetrics(content, symbol, filing.filingDate);
      console.log(`  Quarter: ${extracted.quarterYear}`);

      // Log extracted values
      if (extracted.metrics) {
        console.log('  Metrics extracted:');
        for (const [key, val] of Object.entries(extracted.metrics)) {
          console.log(`    - ${key}: ${val?.display || 'N/A'}`);
        }
      }

      // Cache the results
      if (!dryRun) {
        const cached = await cacheHistoricalMetrics(symbol, quarter, {
          ...extracted,
          accessionNumber: filing.accessionNumber,
          filingDate: filing.filingDate,
          model: 'gemini-3-flash-preview'
        });
        console.log(`  Cached: ${cached ? 'SUCCESS' : 'FAILED'}`);
      } else {
        console.log('  [DRY RUN] Would cache to Redis');
      }

      results.push({
        quarter,
        filingDate: filing.filingDate,
        success: true,
        metrics: extracted.metrics
      });

      // Rate limit between Gemini calls
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`  ERROR: ${error.message}`);
      results.push({
        quarter,
        filingDate: filing.filingDate,
        success: false,
        error: error.message
      });
    }

    console.log('');
  }

  // Summary
  console.log('=== Backfill Summary ===');
  console.log(`Total filings processed: ${results.length}`);
  console.log(`Successful: ${results.filter(r => r.success).length}`);
  console.log(`Failed: ${results.filter(r => !r.success).length}`);

  if (!dryRun) {
    const stats = await getCacheStats(symbol);
    console.log(`\nCache Stats: ${stats.historicalQuartersCached}/${stats.totalQuarters} quarters cached`);
  }

  return results;
}

// CLI handling
const args = process.argv.slice(2);
const options = {
  symbol: 'COHR',
  quarters: 8,
  dryRun: false
};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--symbol' && args[i + 1]) {
    options.symbol = args[i + 1];
    i++;
  } else if (args[i] === '--quarters' && args[i + 1]) {
    options.quarters = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === '--dry-run') {
    options.dryRun = true;
  } else if (args[i] === '--help') {
    console.log(`
Historical Metrics Backfill Script

Usage:
  node scripts/backfill-historical-metrics.js [options]

Options:
  --symbol <TICKER>  Stock ticker symbol (default: COHR)
  --quarters <N>     Number of quarters to backfill (default: 8)
  --dry-run          Run without writing to cache
  --help             Show this help message

Environment Variables:
  GEMINI_API_KEY       Google Gemini API key (required)
  KV_REST_API_URL      Vercel KV REST API URL (required for caching)
  KV_REST_API_TOKEN    Vercel KV REST API Token (required for caching)
`);
    process.exit(0);
  }
}

// Run backfill
backfillHistoricalMetrics(options)
  .then(() => {
    console.log('\nBackfill complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\nBackfill failed:', error);
    process.exit(1);
  });
