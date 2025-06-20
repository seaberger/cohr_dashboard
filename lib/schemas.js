// Schema definitions for LLM data validation and transformation
import { z } from 'zod';

// LLM Output Schema - what Google Gemini returns
export const LLMSegmentSchema = z.object({
  name: z.string(),
  revenue: z.string(),
  growthYoY: z.string().optional(),
  growthQoQ: z.string().optional(),
  keyDriver: z.string().optional(),
  status: z.string().optional()
});

export const LLMOverallSchema = z.object({
  totalRevenue: z.string(),
  revenueGrowthYoY: z.string(),
  revenueGrowthQoQ: z.string().optional(),
  grossMargin: z.string().optional(),
  keyHighlight: z.string().optional()
});

// Universal Metrics Schema
export const UniversalMetricSchema = z.object({
  value: z.string(),
  growth: z.string().optional(),
  change: z.string().optional(),
  trend: z.enum(['positive', 'negative', 'neutral']),
  sparkline: z.array(z.number()).optional()
});

export const UniversalMetricsSchema = z.object({
  revenue: UniversalMetricSchema,
  grossMarginPct: UniversalMetricSchema,
  operatingMarginPct: UniversalMetricSchema,
  operatingIncome: UniversalMetricSchema,
  operatingCashFlow: UniversalMetricSchema,
  rndRatioPct: UniversalMetricSchema,
  netIncome: UniversalMetricSchema,
  epsDiluted: UniversalMetricSchema
});

// Company Insights Schema
export const CompanyInsightSchema = z.object({
  category: z.enum(['growth-driver', 'risk', 'strategic-initiative', 'competitive-advantage', 'guidance']),
  headline: z.string(),
  detail: z.string(),
  impact: z.enum(['positive', 'negative', 'neutral']),
  confidence: z.number().min(0).max(1),
  sourceQuote: z.string().optional()
});

export const LLMOutputSchema = z.object({
  segments: z.array(LLMSegmentSchema),
  overall: LLMOverallSchema,
  quarterYear: z.string(),
  filingDate: z.string(),
  universalMetrics: UniversalMetricsSchema.optional(),
  companyInsights: z.array(CompanyInsightSchema).optional()
});

// Frontend Expected Schema - what the dashboard tiles expect
export const FrontendSegmentSchema = z.object({
  cohrRevenueQ3: z.string().optional(),
  keyDriver: z.string(),
  status: z.string()
}).catchall(z.string()); // Allow dynamic YoY/QoQ fields

export const FrontendOverallSchema = z.object({
  totalRevenueQ2: z.string(),
  revenueGrowthYoY: z.string(),
  revenueGrowthQoQ: z.string().optional(),
  grossMargin: z.string().optional(),
  keyHighlight: z.string()
});

export const FrontendDataSchema = z.object({
  aiDatacomGrowth: FrontendSegmentSchema.nullable().optional(),
  networkingGrowth: FrontendSegmentSchema.nullable().optional(),
  telecomGrowth: FrontendSegmentSchema.nullable().optional(),
  industrialLaserMarket: FrontendSegmentSchema.nullable().optional(),
  materialsGrowth: FrontendSegmentSchema.nullable().optional(),
  cohrOverallPerformance: FrontendOverallSchema,
  universalMetrics: UniversalMetricsSchema.nullable().optional(),
  companyInsights: z.array(CompanyInsightSchema).optional(),
  dataQuality: z.string(),
  lastUpdated: z.string(),
  updateFrequency: z.string(),
  dataType: z.string(),
  quarter: z.string(),
  sources: z.array(z.string()),
  confidence: z.string()
});

// Validation helper functions
export function validateLLMOutput(data) {
  try {
    const result = LLMOutputSchema.parse(data);
    console.log('✅ LLM output validation passed');
    return { success: true, data: result };
  } catch (error) {
    console.log('❌ LLM output validation failed:', error.message);
    return { success: false, error: error.message, issues: error.issues };
  }
}

export function validateFrontendData(data) {
  try {
    const result = FrontendDataSchema.parse(data);
    console.log('✅ Frontend data validation passed');
    return { success: true, data: result };
  } catch (error) {
    console.log('❌ Frontend data validation failed:', error.message);
    return { success: false, error: error.message, issues: error.issues };
  }
}

// Segment mapping configuration - handles both legacy and new segment structures
export const SEGMENT_MAPPINGS = {
  // NEW STRUCTURE (Post-May 2025): Datacenter & Communications + Industrial
  datacenterComms: [
    'datacenter', 'datacom', 'data center', 'communications', 'communication',
    'network', 'networking', 'telecom', 'ai', 'transceiver', '5g', 'infrastructure'
  ],
  industrial: [
    'industrial', 'laser', 'lasers', 'manufacturing', 'precision',
    'material', 'materials', 'substrate', 'semiconductor', 'compound',
    'automotive', 'consumer', 'display', 'microelectronics'
  ],
  
  // LEGACY STRUCTURE (Pre-May 2025): Networking, Materials, Lasers
  networking: ['network', 'networking', 'datacom', 'ai', 'datacenter', 'transceiver'],
  telecom: ['telecom', 'communication', 'infrastructure', '5g'],
  laser: ['laser', 'lasers', 'industrial', 'manufacturing', 'precision'],
  materials: ['material', 'materials', 'substrate', 'semiconductor', 'compound']
};

// Frontend tile mapping - maps identified segments to dashboard tiles
export const FRONTEND_TILE_MAPPINGS = {
  // New structure mappings
  'datacenterComms': ['networkingGrowth', 'aiDatacomGrowth', 'telecomGrowth'],
  'industrial': ['industrialLaserMarket', 'materialsGrowth'],
  
  // Legacy structure mappings - specific 1:1 or 1:2 mappings to avoid overlap
  'networking': ['networkingGrowth', 'aiDatacomGrowth'], // Networking data goes to both network tiles
  'telecom': ['telecomGrowth'],                          // Telecom gets its own tile
  'laser': ['industrialLaserMarket'],                    // Lasers go to industrial tile only
  'materials': ['materialsGrowth']                       // Materials get their own tile only
};

export function identifySegmentType(segmentName) {
  const name = segmentName.toLowerCase().trim();
  
  // Exact legacy segment name matches (highest priority)
  if (name === 'networking' || name === 'networking solutions') {
    return 'networking';
  }
  if (name === 'materials' || name === 'materials and substrates') {
    return 'materials';
  }
  if (name === 'lasers' || name === 'laser systems' || name === 'industrial lasers') {
    return 'laser';
  }
  if (name === 'telecom' || name === 'telecommunications') {
    return 'telecom';
  }
  
  // Check for exact new structure matches 
  if (name.includes('datacenter') && name.includes('communication')) {
    return 'datacenterComms';
  }
  if (name === 'industrial' && !name.includes('laser')) {
    // "Industrial" as standalone segment (new structure)
    return 'industrial';
  }
  
  // Fallback to keyword matching for variations
  for (const [type, keywords] of Object.entries(SEGMENT_MAPPINGS)) {
    if (keywords.some(keyword => name.includes(keyword))) {
      return type;
    }
  }
  
  // Enhanced fallback logic
  if (name.includes('revenue') || name.includes('sales') || name.includes('segment')) {
    return 'other';
  }
  
  console.log(`⚠️  Unknown segment type for: "${segmentName}"`);
  return 'unknown';
}

/**
 * Determine which frontend tiles should display this segment data
 * @param {string} segmentType - The identified segment type
 * @returns {string[]} - Array of frontend tile keys
 */
export function getTargetTiles(segmentType) {
  return FRONTEND_TILE_MAPPINGS[segmentType] || [];
}

/**
 * Detect if we're dealing with new or legacy segment structure
 * @param {Array} segments - Array of segment objects from LLM
 * @returns {string} - 'new' or 'legacy'
 */
export function detectSegmentStructure(segments) {
  const segmentNames = segments.map(s => s.name?.toLowerCase() || '');
  
  // Check for new structure indicators
  const hasDatacenterComms = segmentNames.some(name => 
    name.includes('datacenter') && name.includes('communication')
  );
  const hasStandaloneIndustrial = segmentNames.some(name => 
    name === 'industrial' || (name.includes('industrial') && !name.includes('laser'))
  );
  
  // Check for legacy structure indicators
  const hasNetworking = segmentNames.some(name => name.includes('networking'));
  const hasMaterials = segmentNames.some(name => name.includes('materials'));
  const hasLasers = segmentNames.some(name => name.includes('laser'));
  
  if (hasDatacenterComms || hasStandaloneIndustrial) {
    return 'new';
  } else if (hasNetworking || hasMaterials || hasLasers) {
    return 'legacy';
  }
  
  // Default to legacy for backward compatibility
  return 'legacy';
}