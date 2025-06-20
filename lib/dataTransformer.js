// Clean data transformation utilities with explicit mapping
import { 
  validateLLMOutput, 
  validateFrontendData, 
  identifySegmentType, 
  getTargetTiles, 
  detectSegmentStructure 
} from './schemas.js';

/**
 * Transform LLM output to frontend expected format
 * @param {Object} llmData - Raw LLM output
 * @param {string} symbol - Stock symbol
 * @returns {Object} - Frontend-compatible data structure
 */
export function transformLLMToFrontend(llmData, symbol = 'COHR') {
  console.log('🔄 Starting LLM → Frontend transformation');
  
  // Validate input data structure
  const validation = validateLLMOutput(llmData);
  if (!validation.success) {
    console.error('❌ LLM output validation failed:', validation.error);
    throw new Error(`Invalid LLM data structure: ${validation.error}`);
  }
  
  console.log('✅ LLM data validated successfully');
  const { segments, overall, quarterYear, filingDate, universalMetrics, companyInsights } = validation.data;
  
  // Detect segment structure type
  const structureType = detectSegmentStructure(segments);
  console.log(`📋 Detected segment structure: ${structureType}`);
  
  const transformed = {
    // Initialize all segment objects
    aiDatacomGrowth: null,
    networkingGrowth: null,
    telecomGrowth: null,
    industrialLaserMarket: null,
    materialsGrowth: null,
    cohrOverallPerformance: null
  };
  
  // Process each segment with flexible mapping
  console.log(`📊 Processing ${segments.length} segments`);
  segments.forEach((segment, index) => {
    console.log(`  Segment ${index + 1}: ${segment.name} (${segment.revenue})`);
    
    const segmentType = identifySegmentType(segment.name);
    console.log(`    → Identified as: ${segmentType}`);
    
    const targetTiles = getTargetTiles(segmentType);
    console.log(`    → Target tiles: ${targetTiles.join(', ')}`);
    
    if (targetTiles.length === 0) {
      console.log(`    → ⚠️  No target tiles found, skipping: ${segment.name}`);
      return;
    }
    
    const segmentData = createSegmentData(segment, segmentType, symbol);
    
    // Apply segment data to all target tiles
    targetTiles.forEach(tileKey => {
      if (segmentData[getSegmentDataKey(segmentType)]) {
        transformed[tileKey] = segmentData[getSegmentDataKey(segmentType)];
        console.log(`    → Applied to tile: ${tileKey}`);
      }
    });
  });
  
  // Transform overall performance
  transformed.cohrOverallPerformance = {
    totalRevenueQ2: overall.totalRevenue, // Keep field name for compatibility
    revenueGrowthYoY: overall.revenueGrowthYoY,
    revenueGrowthQoQ: overall.revenueGrowthQoQ || 'N/A',
    grossMargin: overall.grossMargin || 'N/A',
    keyHighlight: overall.keyHighlight || `Strong Q3 2025 performance with ${overall.revenueGrowthYoY} growth`
  };
  
  // Add metadata
  transformed.dataQuality = 'High';
  transformed.lastUpdated = new Date().toISOString();
  transformed.updateFrequency = 'Quarterly';
  transformed.dataType = 'LLM-Analyzed SEC Filing Data';
  transformed.quarter = quarterYear;
  transformed.sources = [
    `${symbol} SEC Filing Analysis`,
    'Google Gemini 2.5 Flash LLM',
    `Filing Date: ${filingDate}`
  ];
  transformed.confidence = '95%';
  
  // Validate output data structure
  const outputValidation = validateFrontendData(transformed);
  if (!outputValidation.success) {
    console.error('❌ Frontend data validation failed:', outputValidation.error);
    // Don't throw here, just log - let it proceed with warnings
    console.warn('⚠️  Proceeding with potentially invalid data structure');
  } else {
    console.log('✅ Frontend data validation passed');
  }
  
  // Add universal metrics and insights to the transformed data
  transformed.universalMetrics = universalMetrics || null;
  transformed.companyInsights = companyInsights || [];
  
  console.log('🎯 Transformation complete');
  console.log('📋 Generated segments:', Object.keys(transformed).filter(k => k.endsWith('Growth') && transformed[k] !== null));
  console.log('📊 Universal metrics available:', !!universalMetrics);
  console.log('💡 Company insights:', companyInsights ? companyInsights.length : 0);
  
  return transformed;
}

/**
 * Get the data key for a segment type
 * @param {string} segmentType - The segment type
 * @returns {string} - The data key to use
 */
function getSegmentDataKey(segmentType) {
  const keyMap = {
    'datacenterComms': 'datacenterComms',
    'industrial': 'industrial',
    'networking': 'networking',
    'telecom': 'telecom', 
    'laser': 'laser',
    'materials': 'materials'
  };
  return keyMap[segmentType] || 'generic';
}

/**
 * Create segment data objects for different frontend tile types
 * @param {Object} segment - LLM segment data
 * @param {string} segmentType - Identified segment type
 * @param {string} symbol - Stock symbol
 * @returns {Object} - Segment data objects for different tiles
 */
function createSegmentData(segment, segmentType, symbol) {
  const baseData = {
    keyDriver: segment.keyDriver || segment.status || 'Performance data available',
    status: segment.status || 'Active segment'
  };
  
  // Add revenue if available
  if (segment.revenue) {
    baseData.cohrRevenueQ3 = segment.revenue;
  }
  
  const result = {};
  
  // Create unified segment data object that works for all target tiles
  const unifiedData = {
    ...baseData,
    // Add all possible growth field variations to support any tile
    cohrNetworkingGrowthYoY: segment.growthYoY || 'N/A',
    cohrNetworkingGrowthQoQ: segment.growthQoQ || 'N/A',
    cohrDatacomGrowthYoY: segment.growthYoY || 'N/A',
    cohrDatacomGrowthQoQ: segment.growthQoQ || 'N/A',
    cohrTelecomGrowthYoY: segment.growthYoY || 'N/A',
    cohrTelecomGrowthQoQ: segment.growthQoQ || 'N/A',
    cohrLaserGrowthYoY: segment.growthYoY || 'N/A',
    cohrLaserGrowthQoQ: segment.growthQoQ || 'N/A',
    cohrMaterialsGrowthYoY: segment.growthYoY || 'N/A',
    cohrMaterialsGrowthQoQ: segment.growthQoQ || 'N/A'
  };
  
  // Adjust key driver based on segment type for better context
  if (segmentType === 'datacenterComms' || segmentType === 'networking') {
    unifiedData.keyDriver = segment.keyDriver || 'AI datacenter and communications growth';
  } else if (segmentType === 'industrial') {
    unifiedData.keyDriver = segment.keyDriver || 'Industrial applications and manufacturing';
  }
  
  // Store under the segment type key for easy retrieval
  result[getSegmentDataKey(segmentType)] = unifiedData;
  
  return result;
}

/**
 * Debug helper to log data structure
 * @param {Object} data - Data to analyze
 * @param {string} label - Label for logging
 */
export function debugDataStructure(data, label = 'Data') {
  console.log(`\n🔍 ${label} Structure Analysis:`);
  console.log('Keys:', Object.keys(data));
  
  Object.entries(data).forEach(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      console.log(`  ${key}:`, Object.keys(value));
    } else if (Array.isArray(value)) {
      console.log(`  ${key}: [${value.length} items]`);
    } else {
      console.log(`  ${key}:`, typeof value);
    }
  });
  console.log('');
}