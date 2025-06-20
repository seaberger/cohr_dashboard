// Company insights extraction using Google Gemini 2.5 Flash Lite
import { analyzeWithGemini } from './geminiService.js';

/**
 * Extract company-specific insights and business intelligence from SEC filings
 * @param {string} filingText - The SEC filing text content
 * @param {string} ticker - The stock ticker symbol
 * @returns {Promise<Object>} - Structured company insights data
 */
export async function extractCompanyInsights(filingText, ticker = 'COHR') {
  const prompt = `
You are a sell-side equity analyst specializing in technology companies.

Extract comprehensive company insights and business intelligence from this SEC filing.

Return ONLY a valid JSON object with this exact structure (no additional text):

{
  "companyInsights": [
    {
      "category": "growth-driver|risk|strategic-initiative|competitive-advantage|guidance|margin-impact|capital-allocation|innovation",
      "headline": "Short headline describing the insight (max 80 chars)",
      "detail": "Detailed explanation with context and implications (max 250 chars)",
      "impact": "positive|negative|neutral",
      "confidence": 0.0-1.0,
      "sourceQuote": "Brief quote from filing supporting this insight (max 50 chars)"
    }
  ],
  "segments": [
    {
      "name": "Segment Name",
      "revenue": "$XXXM",
      "growthYoY": "+XX%",
      "keyDriver": "Main growth driver or performance reason",
      "status": "Performance summary"
    }
  ],
  "quarterYear": "Q3 2025",
  "filingDate": "YYYY-MM-DD"
}

## INSIGHT EXTRACTION GUIDELINES

### 1. Growth Drivers 🚀
- Identify what's driving outsized performance
- New product launches, market expansion, customer wins
- Technology transitions (e.g., 400G→800G, AI datacenter demand)
- Examples: "800G transceiver demand from hyperscalers"

### 2. Risks & Headwinds ⚠️
- Management-flagged risks and challenges
- Market softness, competitive pressure, supply chain issues
- Regulatory or geopolitical impacts
- Examples: "China export controls impact", "smartphone demand weakness"

### 3. Strategic Initiatives 🎯
- M&A activity, partnerships, market expansions
- R&D investments, facility expansions
- Product line extensions or exits
- Examples: "Acquisition of XYZ Corp completed"

### 4. Competitive Advantages 💪
- Technology leadership, patent positions
- Customer relationships, market position
- Manufacturing capabilities, supply chain advantages
- Examples: "Leading coherent DSP technology"

### 5. Guidance & Outlook 📊
- Management commentary on future quarters
- Market trends and demand patterns
- Capital allocation priorities
- Examples: "Q4 guidance raised on strong bookings"

### 6. Margin Impact 💰 (use "margin-impact")
- Factors affecting gross/operating margins
- Product mix changes, cost pressures, pricing dynamics
- Operational leverage or deleverage
- Examples: "Premium product mix drives margin expansion"

### 7. Capital Allocation 🏗️ (use "capital-allocation")
- Share buybacks, dividends, debt management
- Capital expenditures, facility investments
- Cash generation and deployment
- Examples: "$500M share buyback authorized"

### 8. Innovation & Pipeline 🧪 (use "innovation")
- New product developments, R&D progress
- Technology roadmaps, next-gen solutions
- Patent activity, research partnerships
- Examples: "Next-gen coherent platform in development"

## EXTRACTION REQUIREMENTS
- Extract 3-8 insights ranked by materiality
- Focus on company-specific information (not general market trends)
- Include quantitative details when available
- Attribute insights to specific filing sections
- Rate confidence based on clarity of supporting text
- Use impact classification:
  - "positive": clearly beneficial to the business
  - "negative": clearly detrimental or challenging
  - "neutral": informational or mixed impact

## SEGMENT PERFORMANCE (Secondary Focus)
- Extract business segment revenue and growth
- Identify key performance drivers for each segment
- Note any structural changes in segment reporting
- Keep segment data brief (insights are primary focus)

## FORMAT REQUIREMENTS
- Headlines: Concise, specific, actionable
- Details: Context + implications, no jargon
- Source quotes: Exact phrases from the filing
- Confidence: 0.8+ for explicit statements, 0.6+ for inferred insights

CRITICAL: Use ONLY these exact category values:
- "growth-driver"
- "risk" 
- "strategic-initiative"
- "competitive-advantage"
- "guidance"
- "margin-impact"
- "capital-allocation"
- "innovation"

DO NOT use variations like "financial-performance", "performance", etc.
`;

  return analyzeWithGemini(prompt, filingText);
}

/**
 * Validate extracted company insights
 * @param {Object} data - The extracted insights data
 * @returns {boolean} - Whether the data is valid
 */
export function validateCompanyInsights(data) {
  console.log('=== COMPANY INSIGHTS VALIDATION ===');
  console.log('Validating insights with keys:', Object.keys(data));
  
  if (!data || typeof data !== 'object') {
    console.log('Validation failed: data is not an object');
    return false;
  }
  
  // Check for companyInsights array
  if (!Array.isArray(data.companyInsights)) {
    console.log('Validation failed: missing companyInsights array');
    return false;
  }
  
  const validCategories = ['growth-driver', 'risk', 'strategic-initiative', 'competitive-advantage', 'guidance', 'margin-impact', 'capital-allocation', 'innovation'];
  const insights = data.companyInsights;
  let validInsights = 0;
  
  // Clean invalid categories and fix common issues
  for (let i = 0; i < insights.length; i++) {
    const insight = insights[i];
    
    // Fix common category mapping issues
    if (insight.category === 'financial-performance' || insight.category === 'performance') {
      insight.category = 'margin-impact';
      console.log(`⚠️ Fixed category: ${insight.category} → margin-impact`);
    }
    
    if (insight.category && insight.headline && insight.detail && insight.impact && 
        typeof insight.confidence === 'number' && validCategories.includes(insight.category)) {
      validInsights++;
      console.log(`✅ Valid insight: ${insight.category} - ${insight.headline}`);
    } else {
      console.log(`❌ Invalid insight:`, insight);
      // Remove invalid insights
      insights.splice(i, 1);
      i--;
    }
  }
  
  console.log(`Insights validation: ${validInsights}/${insights.length} valid insights after cleanup`);
  
  // Check for segments (optional)
  const hasSegments = Array.isArray(data.segments) && data.segments.length > 0;
  console.log(`Has segment data: ${hasSegments}`);
  
  // Consider successful if we have at least 1 valid insight
  const isValid = validInsights >= 1;
  
  if (isValid) {
    console.log('✅ Company insights validation passed');
  } else {
    console.log('❌ Company insights validation failed');
  }
  
  console.log('=== END INSIGHTS VALIDATION ===');
  return isValid;
}

export default {
  extractCompanyInsights,
  validateCompanyInsights
};