// Google Gemini API Service for LLM-based analysis
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Configure the model
const model = genAI.getGenerativeModel({ 
  model: "models/gemini-2.5-flash-lite-preview-06-17",
  generationConfig: {
    temperature: 0.2, // Lower temperature for more consistent extraction
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 8192,
  },
});

// Rate limiting configuration
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

/**
 * Analyze text content using Gemini 2.5 Flash Lite
 * @param {string} prompt - The prompt to send to Gemini
 * @param {string} content - The content to analyze
 * @returns {Promise<Object>} - Parsed JSON response from Gemini
 */
export async function analyzeWithGemini(prompt, content) {
  try {
    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
    }
    lastRequestTime = Date.now();

    // Combine prompt and content
    const fullPrompt = `${prompt}\n\nContent to analyze:\n${content}`;

    // Generate content
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response
    // Gemini might wrap JSON in markdown code blocks
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      return JSON.parse(jsonStr);
    }

    // If no JSON found, try parsing the entire response
    return JSON.parse(text);

  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error(`Failed to analyze with Gemini: ${error.message}`);
  }
}

/**
 * Extract comprehensive financial data including segments, universal metrics, and insights
 * @param {string} filingText - The SEC filing text content
 * @param {string} ticker - The stock ticker symbol
 * @returns {Promise<Object>} - Structured financial data with segments, metrics, and insights
 */
export async function extractSegmentData(filingText, ticker = 'COHR') {
  const prompt = `
You are a financial analyst expert. Extract comprehensive financial data from this SEC filing.

Instructions:
1. Extract business segment performance with revenue and growth rates
2. Calculate universal financial metrics that apply to all companies
3. Identify key company-specific insights, risks, and growth drivers
4. Extract overall company performance metrics

Return ONLY a valid JSON object with this exact structure (no additional text):
{
  "segments": [
    {
      "name": "Segment Name",
      "revenue": "$X.XB or $XXXM",
      "growthYoY": "+XX%" or "-XX%",
      "growthQoQ": "+XX%" or "-XX%",
      "keyDriver": "Main growth driver or reason for performance",
      "status": "Brief performance summary"
    }
  ],
  "universalMetrics": {
    "revenue": {
      "value": "$X.XB",
      "growth": "+XX%",
      "trend": "positive|negative|neutral",
      "sparkline": [1.2, 1.4, 1.3, 1.5, 1.4, 1.6, 1.5, 1.7]
    },
    "grossMargin": {
      "value": "XX.X%",
      "change": "+X.Xpp",
      "trend": "positive|negative|neutral",
      "sparkline": [32.1, 33.2, 34.1, 35.0, 34.5, 35.2, 35.8, 36.1]
    },
    "operatingMargin": {
      "value": "XX.X%",
      "change": "+X.Xpp",
      "trend": "positive|negative|neutral",
      "sparkline": [8.1, 9.2, 10.1, 11.0, 10.5, 11.2, 11.8, 12.1]
    },
    "freeCashFlow": {
      "value": "$XXXM",
      "growth": "+XX%",
      "trend": "positive|negative|neutral",
      "sparkline": [150, 180, 220, 280, 250, 320, 290, 340]
    },
    "rdRatio": {
      "value": "X.X%",
      "change": "+X.Xpp",
      "trend": "positive|negative|neutral",
      "sparkline": [7.8, 8.1, 8.5, 8.2, 8.7, 8.9, 8.6, 8.8]
    },
    "roic": {
      "value": "XX.X%",
      "change": "+X.Xpp",
      "trend": "positive|negative|neutral",
      "sparkline": [12.1, 13.2, 14.1, 15.0, 14.5, 15.2, 15.8, 16.1]
    },
    "debtToEquity": {
      "value": "X.XX",
      "change": "+X.XX",
      "trend": "positive|negative|neutral",
      "sparkline": [0.65, 0.62, 0.58, 0.55, 0.53, 0.51, 0.48, 0.45]
    },
    "cashAndInvestments": {
      "value": "$X.XB",
      "change": "+XX%",
      "trend": "positive|negative|neutral",
      "sparkline": [0.8, 0.9, 1.1, 1.3, 1.2, 1.4, 1.6, 1.8]
    }
  },
  "companyInsights": [
    {
      "category": "growth-driver|risk|strategic-initiative|competitive-advantage|guidance",
      "headline": "Short headline (max 60 chars)",
      "detail": "Detailed explanation (max 200 chars)",
      "impact": "positive|negative|neutral",
      "confidence": 0.0-1.0,
      "sourceQuote": "Brief quote from filing supporting this insight"
    }
  ],
  "overall": {
    "totalRevenue": "$X.XB",
    "revenueGrowthYoY": "+XX%",
    "revenueGrowthQoQ": "+XX%",
    "grossMargin": "XX.X%",
    "keyHighlight": "Main achievement or highlight"
  },
  "quarterYear": "QX 20XX",
  "filingDate": "YYYY-MM-DD"
}

Important KPI Calculations:
- Revenue: Total revenue/net sales for the quarter
- Gross Margin: (Revenue - COGS) / Revenue * 100
- Operating Margin: Operating Income / Revenue * 100  
- Free Cash Flow: Operating Cash Flow - Capital Expenditures
- R&D Ratio: R&D Expenses / Revenue * 100
- ROIC: NOPAT / Invested Capital * 100 (use net income as proxy if needed)
- Debt/Equity: Total Debt / Total Shareholders' Equity
- Cash & ST Investments: Cash + Short-term investments + Marketable securities

Sparkline Data (8 quarters):
- Generate realistic quarterly progression for each metric
- Use current quarter as the 8th point
- Show logical trends (e.g., margin improvement, debt reduction)
- Revenue should show growth trajectory
- Margins should show operational leverage

Format Requirements:
- Revenue: $X.XB format (e.g., $1.5B, $450M)
- Percentages: X.X% format with +/- for changes
- Ratios: X.XX format (e.g., 0.45)
- Use "N/A" only if truly unavailable
- Trend: "positive" for good changes, "negative" for bad, "neutral" for stable
- Sparkline: 8 realistic data points showing quarterly progression
`;

  return analyzeWithGemini(prompt, filingText);
}

/**
 * Validate extracted segment data
 * @param {Object} data - The extracted segment data
 * @returns {boolean} - Whether the data is valid
 */
export function validateSegmentData(data) {
  console.log('=== VALIDATION DEBUG ===');
  console.log('Validating data with keys:', Object.keys(data));
  
  if (!data || typeof data !== 'object') {
    console.log('Validation failed: data is not an object');
    return false;
  }
  
  // Enhanced validation for new structure with universal metrics
  if (Array.isArray(data.segments) && data.segments.length > 0) {
    console.log('Checking LLM format: segments array with', data.segments.length, 'segments');
    
    // Validate each segment has required fields
    let validSegments = 0;
    for (const segment of data.segments) {
      if (segment.name && segment.revenue && segment.growthYoY) {
        validSegments++;
        console.log('Valid segment:', segment.name);
      } else {
        console.log('Invalid segment missing fields:', segment);
      }
    }
    
    // Check overall performance
    const hasOverall = data.overall && data.overall.totalRevenue && data.overall.revenueGrowthYoY;
    console.log('Has valid overall:', hasOverall);
    
    // Check for universal metrics (new structure)
    const hasUniversalMetrics = data.universalMetrics && 
      data.universalMetrics.revenue && 
      data.universalMetrics.grossMargin;
    console.log('Has universal metrics:', hasUniversalMetrics);
    
    // Check for company insights (new structure)
    const hasInsights = Array.isArray(data.companyInsights) && data.companyInsights.length > 0;
    console.log('Has company insights:', hasInsights, hasInsights ? `(${data.companyInsights.length} insights)` : '');
    
    if (validSegments > 0 && hasOverall) {
      console.log('✅ LLM format validation passed');
      return true;
    }
  }
  
  // Format 2: Pre-transformed format (growth objects)
  const hasGrowthSegments = Object.keys(data).some(key => 
    key.endsWith('Growth') && typeof data[key] === 'object'
  );
  const hasOverallPerformance = data.cohrOverallPerformance || data.overall;
  
  if (hasGrowthSegments && hasOverallPerformance) {
    console.log('✅ Pre-transformed format validation passed');
    return true;
  }
  
  // Format 3: Minimal validation - at least some data structure
  const hasAnyUsefulData = data.segments || data.overall || data.cohrOverallPerformance || 
    Object.keys(data).some(key => key.endsWith('Growth'));
  
  if (hasAnyUsefulData) {
    console.log('⚠️  Partial data validation passed');
    return true;
  }
  
  console.log('❌ Validation failed - no valid data structure found');
  console.log('=== END VALIDATION DEBUG ===');
  return false;
}

/**
 * Get a summary of market trends from segment data
 * @param {Object} segmentData - The validated segment data
 * @returns {string} - Market trend summary
 */
export async function generateMarketSummary(segmentData) {
  const prompt = `
Based on this segment performance data, provide a brief (2-3 sentence) market summary highlighting the key trends and growth drivers. Focus on what's driving performance.

Segment Data:
${JSON.stringify(segmentData, null, 2)}

Provide only the summary text, no JSON or formatting.
`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text().trim();
}

export default {
  analyzeWithGemini,
  extractSegmentData,
  validateSegmentData,
  generateMarketSummary
};