// Google Gemini API Service for LLM-based analysis
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Configure the model
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash",
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
 * Analyze text content using Gemini 2.5 Flash
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
 * Extract business segment data from SEC filing text
 * @param {string} filingText - The SEC filing text content
 * @param {string} ticker - The stock ticker symbol
 * @returns {Promise<Object>} - Structured segment performance data
 */
export async function extractSegmentData(filingText, ticker = 'COHR') {
  const prompt = `
You are a financial analyst expert. Extract business segment performance data from this SEC filing.

Instructions:
1. Find all business segments mentioned with revenue figures
2. Calculate year-over-year (YoY) and quarter-over-quarter (QoQ) growth percentages
3. Identify key growth drivers and performance status for each segment
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

Important:
- Include all segments mentioned with revenue data
- Use exact figures from the filing
- Format percentages with + or - sign
- Keep segment names consistent with filing terminology
`;

  return analyzeWithGemini(prompt, filingText);
}

/**
 * Validate extracted segment data
 * @param {Object} data - The extracted segment data
 * @returns {boolean} - Whether the data is valid
 */
export function validateSegmentData(data) {
  if (!data || typeof data !== 'object') return false;
  
  // Check required fields
  if (!Array.isArray(data.segments) || data.segments.length === 0) return false;
  if (!data.overall || typeof data.overall !== 'object') return false;
  if (!data.quarterYear || !data.filingDate) return false;
  
  // Validate segment structure
  for (const segment of data.segments) {
    if (!segment.name || !segment.revenue || !segment.growthYoY) {
      return false;
    }
  }
  
  // Validate overall structure
  const required = ['totalRevenue', 'revenueGrowthYoY', 'grossMargin'];
  for (const field of required) {
    if (!data.overall[field]) return false;
  }
  
  return true;
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
  const response = await result.response;
  return response.text().trim();
}

export default {
  analyzeWithGemini,
  extractSegmentData,
  validateSegmentData,
  generateMarketSummary
};