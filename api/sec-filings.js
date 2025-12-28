// SEC EDGAR API Integration for fetching company filings
import fetch from 'node-fetch';

// SEC EDGAR API configuration
const SEC_API_BASE = 'https://data.sec.gov';
const USER_AGENT = 'COHR-Dashboard/1.0 (sean.bergman.dev@gmail.com)';

// Simple in-memory cache
const cache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

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

  const { symbol = 'COHR', type = '10-Q', refresh = 'false' } = req.query;

  // Set Vercel CDN cache headers (persists across cold starts)
  // SEC filings change infrequently (quarterly), so cache for 24 hours
  if (refresh === 'true') {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  } else {
    // Cache at Vercel CDN for 24 hours, serve stale for 7 days while revalidating
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
  }

  try {
    // Check cache first
    const cacheKey = `${symbol}-${type}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      console.log(`Returning cached filing for ${symbol}`);
      return res.status(200).json(cachedData.data);
    }

    // Step 1: Get company CIK (Central Index Key)
    const cik = await getCompanyCIK(symbol);
    if (!cik) {
      throw new Error(`Could not find CIK for symbol ${symbol}`);
    }

    // Step 2: Get recent filings
    const filings = await getRecentFilings(cik, type);
    if (!filings || filings.length === 0) {
      throw new Error(`No ${type} filings found for ${symbol}`);
    }

    // Step 3: Get the most recent filing content
    const latestFiling = filings[0];
    const filingContent = await getFilingContent(latestFiling);

    // Step 4: Extract relevant sections
    const extractedData = extractFilingSections(filingContent, type);

    const response = {
      status: 'success',
      symbol,
      cik,
      filing: {
        type,
        filingDate: latestFiling.filingDate,
        acceptanceDate: latestFiling.acceptanceDateTime,
        accessionNumber: latestFiling.accessionNumber,
        documentUrl: latestFiling.primaryDocument,
      },
      content: extractedData,
      extractedAt: new Date().toISOString()
    };

    // Cache the response
    cache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('SEC filings API error:', error);
    res.status(500).json({
      error: 'Failed to fetch SEC filings',
      message: error.message,
      symbol
    });
  }
}

async function getCompanyCIK(symbol) {
  try {
    // Hardcode known CIKs for reliability
    const knownCIKs = {
      'COHR': '0000820318'  // Coherent Corp
    };

    if (knownCIKs[symbol.toUpperCase()]) {
      return knownCIKs[symbol.toUpperCase()];
    }

    // Fallback to SEC's company tickers file
    const response = await fetch('https://www.sec.gov/files/company_tickers.json', {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch company tickers');
    }

    const data = await response.json();
    
    // Find the company by ticker symbol
    const company = Object.values(data).find(
      comp => comp.ticker.toUpperCase() === symbol.toUpperCase()
    );

    if (company) {
      // Pad CIK with leading zeros to make it 10 digits
      return String(company.cik_str).padStart(10, '0');
    }

    return null;
  } catch (error) {
    console.error('Error fetching CIK:', error);
    throw error;
  }
}

async function getRecentFilings(cik, formType) {
  try {
    const url = `${SEC_API_BASE}/submissions/CIK${cik}.json`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch filings: ${response.status}`);
    }

    const data = await response.json();
    const recentFilings = data.filings.recent;

    // Filter for the requested form type
    const filteredFilings = [];
    for (let i = 0; i < recentFilings.form.length; i++) {
      if (recentFilings.form[i] === formType) {
        filteredFilings.push({
          form: recentFilings.form[i],
          filingDate: recentFilings.filingDate[i],
          acceptanceDateTime: recentFilings.acceptanceDateTime[i],
          accessionNumber: recentFilings.accessionNumber[i],
          accessionNumberClean: recentFilings.accessionNumber[i].replace(/-/g, ''),
          primaryDocument: recentFilings.primaryDocument[i],
          cik: cik
        });
      }
    }

    // Sort by filing date (most recent first)
    filteredFilings.sort((a, b) => new Date(b.filingDate) - new Date(a.filingDate));

    return filteredFilings.slice(0, 5); // Return top 5 most recent
  } catch (error) {
    console.error('Error fetching filings:', error);
    throw error;
  }
}

async function getFilingContent(filing) {
  try {
    // Remove leading zeros from CIK for URL path
    const cikForUrl = filing.cik.replace(/^0+/, '');
    
    // Construct the correct URL for the filing document
    const url = `https://www.sec.gov/Archives/edgar/data/${cikForUrl}/${filing.accessionNumberClean}/${filing.primaryDocument}`;
    
    console.log(`Fetching filing from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch filing content: ${response.status} from ${url}`);
    }

    const html = await response.text();
    return html;
  } catch (error) {
    console.error('Error fetching filing content:', error);
    throw error;
  }
}

function extractFilingSections(html, formType) {
  // Remove HTML tags and clean up text
  const textContent = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove styles
    .replace(/<[^>]+>/g, ' ') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
    .replace(/&[a-zA-Z]+;/g, ' ') // Remove other HTML entities
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // Extract key sections based on common patterns
  const sections = {
    fullText: textContent.substring(0, 500000), // Limit to 500K chars for Gemini
    managementDiscussion: extractSection(textContent, 
      ['Management Discussion and Analysis', 'MD&A', 'Item 2.'],
      ['Item 3.', 'Risk Factors', 'Controls and Procedures']
    ),
    businessSegments: extractSection(textContent,
      ['Segment', 'Revenue by', 'Product Revenue', 'Geographic Revenue'],
      ['Risk Factors', 'Legal Proceedings']
    ),
    financialHighlights: extractSection(textContent,
      ['Financial Highlights', 'Results of Operations', 'Consolidated Statement'],
      ['Risk Factors', 'Subsequent Events']
    )
  };

  // Try to extract tables with financial data
  const tablePattern = /([A-Za-z\s]+)\s+\$?\s*([\d,]+\.?\d*)\s+\$?\s*([\d,]+\.?\d*)/g;
  const tables = [];
  let match;
  
  while ((match = tablePattern.exec(textContent)) !== null && tables.length < 50) {
    tables.push({
      label: match[1].trim(),
      value1: match[2],
      value2: match[3]
    });
  }

  sections.extractedTables = tables;

  return sections;
}

function extractSection(text, startPatterns, endPatterns) {
  let startIndex = -1;
  let endIndex = text.length;

  // Find the start of the section
  for (const pattern of startPatterns) {
    const regex = new RegExp(pattern, 'i');
    const match = text.match(regex);
    if (match && (startIndex === -1 || match.index < startIndex)) {
      startIndex = match.index;
    }
  }

  if (startIndex === -1) return '';

  // Find the end of the section
  for (const pattern of endPatterns) {
    const regex = new RegExp(pattern, 'i');
    const match = text.substring(startIndex + 100).match(regex);
    if (match && match.index + startIndex + 100 < endIndex) {
      endIndex = match.index + startIndex + 100;
    }
  }

  // Extract and clean the section
  const section = text.substring(startIndex, endIndex);
  
  // Limit section size to prevent token overflow
  return section.substring(0, 100000); // 100K chars per section
}