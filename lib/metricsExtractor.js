// Specialized GAAP metrics extraction using Google Gemini 2.5 Flash Lite
import { analyzeWithGemini } from './geminiService.js';

/**
 * Extract universal financial metrics with focused GAAP-based prompting
 * Uses UNIFIED FORMAT with both numeric values and display strings for sparkline compatibility
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
  "metrics": {
    "revenue": {
      "value": 1500.0,
      "unit": "millions",
      "display": "$1,500M",
      "growth": "+17%",
      "trend": "positive"
    },
    "grossMarginPct": {
      "value": 35.0,
      "unit": "percent",
      "display": "35.0%",
      "change": "+3.0pp",
      "trend": "positive"
    },
    "operatingMarginPct": {
      "value": 8.5,
      "unit": "percent",
      "display": "8.5%",
      "change": "+2.5pp",
      "trend": "positive"
    },
    "operatingIncome": {
      "value": 127.5,
      "unit": "millions",
      "display": "$128M",
      "growth": "+25%",
      "trend": "positive"
    },
    "operatingCashFlow": {
      "value": 180.0,
      "unit": "millions",
      "display": "$180M",
      "growth": "+15%",
      "trend": "positive"
    },
    "rndRatioPct": {
      "value": 8.2,
      "unit": "percent",
      "display": "8.2%",
      "change": "-0.3pp",
      "trend": "neutral"
    },
    "netIncome": {
      "value": 95.0,
      "unit": "millions",
      "display": "$95M",
      "growth": "+20%",
      "trend": "positive"
    },
    "epsDiluted": {
      "value": 0.62,
      "unit": "dollars",
      "display": "$0.62",
      "growth": "+18%",
      "trend": "positive"
    }
  },
  "quarterYear": "Q3 2025",
  "quarter": "2025-Q3",
  "filingDate": "YYYY-MM-DD"
}

## EXTRACTION INSTRUCTIONS

IMPORTANT: The "value" field must be a NUMERIC value (not a string). The "display" field contains the formatted string.

### 1. Revenue
- Extract "Total revenues" from the left-most "Three months ended" column in the Condensed Consolidated Statements of Operations
- value: numeric in millions (e.g., 1500.0 for $1.5 billion)
- unit: "millions"
- display: formatted string (e.g., "$1,500M")

### 2. Gross Margin %
- If a "% Gross margin" or "Gross margin %" row exists in the statements, return it directly
- Otherwise: compute (1 − Cost of goods sold ÷ Total revenues) × 100 using current-quarter values
- value: numeric percentage (e.g., 35.0)
- unit: "percent"
- display: formatted string (e.g., "35.0%")

### 3. Operating Margin %
- Extract "Operating income" and "Total revenues" from the current-quarter column
- Compute (Operating income ÷ Total revenues) × 100
- value: numeric percentage (e.g., 8.5)
- unit: "percent"
- display: formatted string (e.g., "8.5%")

### 4. Operating Income
- Extract "Operating income" from current-quarter column of Operations statement
- value: numeric in millions (e.g., 127.5)
- unit: "millions"
- display: formatted string (e.g., "$128M")

### 5. Operating Cash Flow
- In the Condensed Consolidated Statements of Cash Flows, find "Net cash provided by operating activities"
- Prefer the shortest period presented (three-month over year-to-date)
- value: numeric in millions (e.g., 180.0)
- unit: "millions"
- display: formatted string (e.g., "$180M")

### 6. R&D / Revenue %
- Extract "Research and development expenses" and "Total revenues" for current quarter
- Compute (R&D expenses ÷ Total revenues) × 100
- value: numeric percentage (e.g., 8.2)
- unit: "percent"
- display: formatted string (e.g., "8.2%")

### 7. Net Income
- Extract "Net income attributable to [Company]" or "Net income" if single line
- Use current-quarter column from Operations statement
- value: numeric in millions (e.g., 95.0)
- unit: "millions"
- display: formatted string (e.g., "$95M")

### 8. Diluted EPS
- Extract "Earnings per share—diluted" from current-quarter column of Operations statement
- value: numeric (e.g., 0.62)
- unit: "dollars"
- display: formatted string (e.g., "$0.62")

## FORMAT REQUIREMENTS
- value: MUST be a number (integer or decimal), NOT a string
- unit: one of "millions", "percent", or "dollars"
- display: formatted string for UI display
- growth/change: Use +XX% or +X.Xpp format with + or - sign
- trend: "positive" for improving metrics, "negative" for declining, "neutral" for stable
- quarter: Use YYYY-QX format (e.g., "2025-Q3")
- quarterYear: Use QX YYYY format (e.g., "Q3 2025")
- Set value to null ONLY if the data is truly not available in the filing
`;

  return analyzeWithGemini(prompt, filingText);
}

/**
 * Validate extracted universal metrics (supports both old and new format)
 * @param {Object} data - The extracted metrics data
 * @returns {boolean} - Whether the data is valid
 */
export function validateUniversalMetrics(data) {
  console.log('=== UNIVERSAL METRICS VALIDATION ===');
  console.log('Validating metrics with keys:', Object.keys(data || {}));

  if (!data || typeof data !== 'object') {
    console.log('Validation failed: data is not an object');
    return false;
  }

  // Support both new format (metrics) and legacy format (universalMetrics)
  const metrics = data.metrics || data.universalMetrics;

  if (!metrics || typeof metrics !== 'object') {
    console.log('Validation failed: missing metrics object');
    return false;
  }

  const requiredMetrics = [
    'revenue', 'grossMarginPct', 'operatingMarginPct', 'operatingIncome',
    'operatingCashFlow', 'rndRatioPct', 'netIncome', 'epsDiluted'
  ];

  let validMetrics = 0;
  let totalMetrics = 0;

  for (const metricKey of requiredMetrics) {
    totalMetrics++;
    const metric = metrics[metricKey];
    // Check for numeric value (new format) or string value (legacy)
    const hasValidValue = metric &&
      (typeof metric.value === 'number' ||
       (typeof metric.value === 'string' && metric.value !== 'N/A'));

    if (hasValidValue) {
      validMetrics++;
      console.log(`✅ Valid metric: ${metricKey} = ${metric.value} (${typeof metric.value})`);
    } else {
      console.log(`❌ Missing or null metric: ${metricKey}`);
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

/**
 * Normalize metrics data to unified format (for backward compatibility)
 * @param {Object} data - The extracted metrics data (old or new format)
 * @returns {Object} - Normalized metrics in unified format
 */
export function normalizeToUnifiedFormat(data) {
  const metrics = data.metrics || data.universalMetrics;
  if (!metrics) return data;

  // Already in new format
  if (data.metrics) return data;

  // Convert from legacy format (value is display string) to unified format
  const normalizedMetrics = {};

  for (const [key, metric] of Object.entries(metrics)) {
    if (typeof metric.value === 'string') {
      // Parse display string to numeric value
      const numericValue = parseDisplayValue(metric.value);
      normalizedMetrics[key] = {
        value: numericValue,
        unit: inferUnit(key),
        display: metric.value,
        growth: metric.growth,
        change: metric.change,
        trend: metric.trend
      };
    } else {
      normalizedMetrics[key] = metric;
    }
  }

  return {
    ...data,
    metrics: normalizedMetrics,
    universalMetrics: undefined // Remove legacy key
  };
}

/**
 * Parse display value string to numeric value
 */
function parseDisplayValue(displayStr) {
  if (typeof displayStr === 'number') return displayStr;
  if (typeof displayStr !== 'string' || displayStr === 'N/A') return null;

  let cleaned = displayStr.replace(/[$,\s]/g, '');

  // Handle negative values in parentheses
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    cleaned = '-' + cleaned.slice(1, -1);
  }

  // Handle millions suffix
  const millionMatch = cleaned.match(/^(-?[\d.]+)M$/i);
  if (millionMatch) return parseFloat(millionMatch[1]);

  // Handle billions suffix
  const billionMatch = cleaned.match(/^(-?[\d.]+)B$/i);
  if (billionMatch) return parseFloat(billionMatch[1]) * 1000;

  // Handle percentages
  const percentMatch = cleaned.match(/^(-?[\d.]+)%$/);
  if (percentMatch) return parseFloat(percentMatch[1]);

  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Infer unit from metric key
 */
function inferUnit(key) {
  if (key.endsWith('Pct') || key.includes('Margin') || key.includes('Ratio')) {
    return 'percent';
  }
  if (key === 'epsDiluted') {
    return 'dollars';
  }
  return 'millions';
}

export default {
  extractUniversalMetrics,
  validateUniversalMetrics,
  normalizeToUnifiedFormat
};