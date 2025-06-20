// Test script for universal financial metrics implementation
import { extractSegmentData, validateSegmentData } from '../lib/geminiService.js';

// Mock SEC filing text with financial data
const mockFilingText = `
COHERENT CORP.
FORM 10-Q
For the quarterly period ended September 30, 2025

Financial Results:
Total Revenue: $1.52 billion, up 24% year-over-year
Gross Margin: 35.5%, up 120 basis points from prior year
Operating Margin: 12.3%, down 50 basis points from prior year
Free Cash Flow: $320 million, up 45% year-over-year
R&D Expenses: $125 million, representing 8.2% of revenue
Total Debt: $1.2 billion, Total Equity: $2.86 billion
Net Income: $145 million, Total Assets: $1.86 billion
Diluted EPS: $1.21, up 31% year-over-year

Business Segments:
- Networking: Revenue of $650 million, up 45% YoY driven by AI datacenter demand
- Materials: Revenue of $420 million, down 1% YoY due to slower industrial markets  
- Lasers: Revenue of $450 million, up 4% YoY from semiconductor equipment strength

Key Business Developments:
- Record 800G transceiver orders from hyperscale customers
- Inventory optimization initiatives showing results
- China export restrictions creating some headwinds
- Strong cash generation supporting debt reduction
`;

async function testUniversalMetrics() {
    console.log('Testing Universal Financial Metrics Extraction...\n');
    
    try {
        // Test extraction
        console.log('1. Extracting data from mock filing...');
        const result = await extractSegmentData(mockFilingText, 'COHR');
        
        console.log('\n2. Validating extracted data...');
        const isValid = validateSegmentData(result);
        console.log('Validation result:', isValid ? '✅ PASSED' : '❌ FAILED');
        
        console.log('\n3. Universal Metrics:');
        if (result.universalMetrics) {
            Object.entries(result.universalMetrics).forEach(([key, metric]) => {
                console.log(`   ${key}: ${metric.value} (${metric.trend})`);
            });
        } else {
            console.log('   ❌ No universal metrics found');
        }
        
        console.log('\n4. Company Insights:');
        if (result.companyInsights && result.companyInsights.length > 0) {
            result.companyInsights.forEach((insight, i) => {
                console.log(`   ${i + 1}. [${insight.category}] ${insight.headline}`);
                console.log(`      Impact: ${insight.impact}, Confidence: ${insight.confidence}`);
            });
        } else {
            console.log('   ❌ No insights found');
        }
        
        console.log('\n5. Business Segments:');
        if (result.segments && result.segments.length > 0) {
            result.segments.forEach(segment => {
                console.log(`   ${segment.name}: ${segment.revenue} (${segment.growthYoY})`);
            });
        }
        
        // Save test output
        console.log('\n6. Full response structure:');
        console.log(JSON.stringify(result, null, 2));
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Run test if GEMINI_API_KEY is available
if (process.env.GEMINI_API_KEY) {
    testUniversalMetrics();
} else {
    console.log('Please set GEMINI_API_KEY environment variable to run this test');
}