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
      "category": "growth-driver|margin-impact|risk|strategic-move|capital-allocation|innovation|market-dynamics|operations",
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

### 1. Growth Drivers 🚀 (use "growth-driver")
- New revenue engines, secular tailwinds, market-share wins
- Technology transitions driving demand (e.g., 400G→800G, AI datacenter)
- New product launches, customer wins, geographic expansion
- Examples: "800G transceiver demand from hyperscalers", "5G infrastructure buildout"

### 2. Margin Impact 💰 (use "margin-impact")
- Cost take-outs, mix shift, pricing power, commodity swings
- Product mix changes affecting profitability
- Operational leverage or deleverage, efficiency improvements
- Examples: "Premium product mix drives margin expansion", "Raw material cost inflation"

### 3. Risks & Headwinds ⚠️ (use "risk")
- Litigation, macro headwinds, regulatory changes, FX exposure
- Market softness, competitive pressure, supply chain disruptions
- Geopolitical impacts, trade restrictions
- Examples: "China export controls impact", "Smartphone demand weakness"

### 4. Strategic Moves 🎯 (use "strategic-move")
- M&A, divestitures, new reporting segments, major hires
- Partnerships, joint ventures, strategic investments
- Organizational restructuring, leadership changes
- Examples: "Acquisition of XYZ Corp completed", "New CEO appointment"

### 5. Capital Allocation 🏗️ (use "capital-allocation")
- Buybacks, dividends, debt pay-down/issuance, big cap-ex
- Cash generation and deployment strategies
- Investment priorities, facility expansions
- Examples: "$500M share buyback authorized", "Major fab expansion"

### 6. Innovation & Pipeline 🧪 (use "innovation")
- Patents, product launches, R&D milestones
- Technology roadmaps, next-gen solutions in development
- Research partnerships, breakthrough technologies
- Examples: "Next-gen coherent platform in development", "AI chip breakthrough"

### 7. Market Dynamics 📊 (use "market-dynamics")
- Industry demand shifts, competitor actions, TAM changes, pricing environment
- Market consolidation, competitive landscape changes
- End-market trends affecting demand
- Examples: "AI datacenter TAM expansion", "Competitive pricing pressure"

### 8. Operations 🛠️ (use "operations")
- Supply-chain issues, manufacturing yields, plant closures/expansions
- Production capacity, operational efficiency initiatives
- Quality issues, process improvements
- Examples: "Supply chain optimization", "Manufacturing yield improvements"

## EXTRACTION REQUIREMENTS
- Extract 4-8 insights ranked by materiality and investment relevance
- Focus on company-specific information that affects valuation or investment thesis
- Include quantitative details and financial impact when available
- Attribute insights to specific filing sections or management commentary
- Rate confidence based on clarity of supporting text and explicit vs inferred nature
- Use impact classification:
  - "positive": clearly beneficial to financial performance or competitive position
  - "negative": clearly detrimental to financial performance or creates investment risks
  - "neutral": informational updates or mixed/unclear impact

## INVESTMENT ANALYSIS FOCUS
Prioritize insights that would be material to:
- Revenue growth trajectory and sustainability
- Margin expansion/contraction drivers
- Capital allocation efficiency and returns
- Competitive positioning and market share
- Operational leverage and scalability
- Risk factors affecting business model

## SEGMENT PERFORMANCE (Secondary Focus)
- Extract business segment revenue and growth rates
- Identify key performance drivers and outlook for each segment
- Note any structural changes in segment reporting or business mix
- Keep segment data brief (insights are primary focus)

## FORMAT REQUIREMENTS
- Headlines: Investment-focused, specific, actionable (max 80 chars)
- Details: Business context + financial implications + outlook (max 250 chars)
- Source quotes: Exact phrases from SEC filing supporting the insight (max 50 chars)
- Confidence: 0.85+ for explicit management statements, 0.7+ for clear financial data trends, 0.6+ for inferred insights

CRITICAL: Use ONLY these exact category values:
- "growth-driver"
- "margin-impact"
- "risk"
- "strategic-move"
- "capital-allocation"
- "innovation"
- "market-dynamics"
- "operations"

DO NOT use variations like "strategic-initiative", "competitive-advantage", "guidance", "financial-performance", etc.
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
  
  const validCategories = ['growth-driver', 'margin-impact', 'risk', 'strategic-move', 'capital-allocation', 'innovation', 'market-dynamics', 'operations'];
  const insights = data.companyInsights;
  let validInsights = 0;
  
  // Clean invalid categories and fix common issues
  for (let i = 0; i < insights.length; i++) {
    const insight = insights[i];
    
    // Fix common category mapping issues
    if (insight.category === 'financial-performance' || insight.category === 'performance') {
      insight.category = 'margin-impact';
      console.log(`⚠️ Fixed category: financial-performance → margin-impact`);
    }
    if (insight.category === 'strategic-initiative') {
      insight.category = 'strategic-move';
      console.log(`⚠️ Fixed category: strategic-initiative → strategic-move`);
    }
    if (insight.category === 'competitive-advantage') {
      insight.category = 'innovation';
      console.log(`⚠️ Fixed category: competitive-advantage → innovation`);
    }
    if (insight.category === 'guidance') {
      insight.category = 'market-dynamics';
      console.log(`⚠️ Fixed category: guidance → market-dynamics`);
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