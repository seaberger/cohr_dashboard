// Specialized GAAP metrics extraction using Google Gemini 2.5 Flash Lite
import { analyzeWithGemini } from './geminiService.js';

/**
 * Extract universal financial metrics with focused GAAP-based prompting
 * @param {string} filingText - The SEC filing text content
 * @param {string} ticker - The stock ticker symbol
 * @returns {Promise<Object>} - Structured universal metrics data
 */
export async function extractUniversalMetrics(filingText, ticker = 'COHR') {
  const prompt = `
You are a financial analyst expert specializing in SEC filing analysis.

Extract the following 8 universal financial metrics from this SEC filing. Focus ONLY on the current quarter data from the Condensed Consolidated Statements.

Return ONLY a valid JSON object with this exact structure (no additional text):

{
  "universalMetrics": {
    "revenue": {
      "value": "$X,XXXM",
      "growth": "+XX%",
      "trend": "positive|negative|neutral",
      "sparkline": [1200, 1300, 1350, 1400, 1450, 1500, 1550, 1500]
    },
    "grossMarginPct": {
      "value": "XX.X%",
      "change": "+X.Xpp",
      "trend": "positive|negative|neutral",
      "sparkline": [30.0, 31.0, 32.0, 33.0, 34.0, 34.5, 35.2, 35.0]
    },
    "operatingMarginPct": {
      "value": "XX.X%",
      "change": "+X.Xpp",
      "trend": "positive|negative|neutral",
      "sparkline": [8.0, 9.0, 10.0, 11.0, 12.0, 11.5, 12.2, 12.5]
    },
    "operatingIncome": {
      "value": "$XXXM",
      "growth": "+XX%",
      "trend": "positive|negative|neutral",
      "sparkline": [150, 180, 200, 220, 250, 280, 270, 290]
    },
    "operatingCashFlow": {
      "value": "$XXXM",
      "growth": "+XX%",
      "trend": "positive|negative|neutral",
      "sparkline": [200, 250, 280, 320, 350, 380, 360, 400]
    },
    "rndRatioPct": {
      "value": "X.X%",
      "change": "+X.Xpp",
      "trend": "positive|negative|neutral",
      "sparkline": [8.5, 8.7, 8.9, 9.0, 9.2, 9.5, 9.8, 10.0]
    },
    "netIncome": {
      "value": "$XXXM",
      "growth": "+XX%",
      "trend": "positive|negative|neutral",
      "sparkline": [120, 140, 160, 180, 200, 220, 210, 240]
    },
    "epsDiluted": {
      "value": "$X.XX",
      "growth": "+XX%",
      "trend": "positive|negative|neutral",
      "sparkline": [1.20, 1.40, 1.60, 1.80, 2.00, 2.20, 2.10, 2.40]
    }
  },
  "quarterYear": "Q3 2025",
  "filingDate": "YYYY-MM-DD"
}

## EXTRACTION INSTRUCTIONS

### 1. Revenue
- Extract "Total revenues" from the left-most "Three months ended" column in the Condensed Consolidated Statements of Operations
- Return in millions USD format: $X,XXXM (e.g., $1,500M)

### 2. Gross Margin %
- If a "% Gross margin" or "Gross margin %" row exists in the statements, return it directly
- Otherwise: compute (1 − Cost of goods sold ÷ Total revenues) × 100 using current-quarter values
- Return one-decimal percent format: XX.X%

### 3. Operating Margin %
- Extract "Operating income" and "Total revenues" from the current-quarter column
- Compute (Operating income ÷ Total revenues) × 100
- Return one-decimal percent format: XX.X%

### 4. Operating Income
- Extract "Operating income" from current-quarter column of Operations statement
- Return in millions USD format: $XXXM

### 5. Operating Cash Flow
- In the Condensed Consolidated Statements of Cash Flows, find "Net cash provided by operating activities"
- Prefer the shortest period presented (three-month over year-to-date)
- Return in millions USD format: $XXXM

### 6. R&D / Revenue %
- Extract "Research and development expenses" and "Total revenues" for current quarter
- Compute (R&D expenses ÷ Total revenues) × 100
- Return one-decimal percent format: X.X%

### 7. Net Income
- Extract "Net income attributable to [Company]" or "Net income" if single line
- Use current-quarter column from Operations statement
- Return in millions USD format: $XXXM

### 8. Diluted EPS
- Extract "Earnings per share—diluted" from current-quarter column of Operations statement
- Return decimal USD per share format: $X.XX

## FORMAT REQUIREMENTS
- Dollar amounts: Use $X,XXXM format (e.g., $1,500M not $1.5B)
- Percentages: Use X.X% format with one decimal place
- EPS: Use $X.XX format (e.g., $2.45)
- Growth/Change: Use +XX% or +X.Xpp format with + or - sign
- Trend: "positive" for improving metrics, "negative" for declining, "neutral" for stable
- Use "N/A" ONLY if the data is truly not available in the filing
- Sparklines: Generate 8 realistic quarterly data points showing progression

## SPARKLINE GUIDANCE
- Revenue: Show growth trajectory in millions over 8 quarters
- Margins: Show percentage progression over time
- Dollar amounts: Show realistic quarterly progression in millions
- EPS: Show per-share progression over 8 quarters
- Use current quarter as the 8th (rightmost) point
- Show logical business progression (seasonal patterns, growth trends)
`;

  return analyzeWithGemini(prompt, filingText);
}

/**
 * Validate extracted universal metrics
 * @param {Object} data - The extracted metrics data
 * @returns {boolean} - Whether the data is valid
 */
export function validateUniversalMetrics(data) {
  console.log('=== UNIVERSAL METRICS VALIDATION ===');
  console.log('Validating metrics with keys:', Object.keys(data));
  
  if (!data || typeof data !== 'object') {
    console.log('Validation failed: data is not an object');
    return false;
  }
  
  // Check for universalMetrics structure
  if (!data.universalMetrics || typeof data.universalMetrics !== 'object') {
    console.log('Validation failed: missing universalMetrics object');
    return false;
  }
  
  const metrics = data.universalMetrics;
  const requiredMetrics = [
    'revenue', 'grossMarginPct', 'operatingMarginPct', 'operatingIncome',
    'operatingCashFlow', 'rndRatioPct', 'netIncome', 'epsDiluted'
  ];
  
  let validMetrics = 0;
  let totalMetrics = 0;
  
  for (const metricKey of requiredMetrics) {
    totalMetrics++;
    if (metrics[metricKey] && metrics[metricKey].value && metrics[metricKey].value !== 'N/A') {
      validMetrics++;
      console.log(`✅ Valid metric: ${metricKey} = ${metrics[metricKey].value}`);
    } else {
      console.log(`❌ Missing or N/A metric: ${metricKey}`);
    }
  }
  
  console.log(`Metrics validation: ${validMetrics}/${totalMetrics} valid`);
  
  // Consider successful if we have at least 50% of metrics
  const isValid = validMetrics >= (totalMetrics * 0.5);
  
  if (isValid) {
    console.log('✅ Universal metrics validation passed');
  } else {
    console.log('❌ Universal metrics validation failed');
  }
  
  console.log('=== END METRICS VALIDATION ===');
  return isValid;
}

export default {
  extractUniversalMetrics,
  validateUniversalMetrics
};