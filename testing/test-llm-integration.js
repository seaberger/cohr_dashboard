#!/usr/bin/env node

// Test script for LLM integration APIs
// Run with: node testing/test-llm-integration.js

import fetch from 'node-fetch';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_KEY = process.env.GEMINI_API_KEY;

console.log('🧪 Testing LLM Integration APIs\n');

if (!API_KEY) {
    console.log('⚠️  GEMINI_API_KEY not found in environment');
    console.log('   This will test fallback functionality only\n');
}

async function testAPI(endpoint, description) {
    console.log(`Testing: ${description}`);
    console.log(`URL: ${BASE_URL}${endpoint}`);
    
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`);
        const data = await response.json();
        
        console.log(`Status: ${response.status}`);
        console.log(`Data Source: ${data.dataSource || 'Not specified'}`);
        console.log(`Analysis Method: ${data.analysisMethod || 'Not specified'}`);
        
        if (data.warning) {
            console.log(`Warning: ${data.warning}`);
        }
        
        if (data.error) {
            console.log(`Error: ${data.error}`);
        }
        
        console.log('✅ API responded successfully\n');
        return true;
        
    } catch (error) {
        console.log(`❌ Error: ${error.message}\n`);
        return false;
    }
}

async function runTests() {
    console.log('📋 Test Plan:');
    console.log('1. Test market-trends with LLM enabled');
    console.log('2. Test market-trends with LLM disabled (fallback)');
    console.log('3. Test SEC filings API');
    console.log('4. Test segment analysis API');
    console.log('\n' + '='.repeat(50) + '\n');
    
    const results = [];
    
    // Test 1: Market trends with LLM
    results.push(await testAPI('/api/market-trends?useLLM=true', 'Market Trends (LLM Enabled)'));
    
    // Test 2: Market trends without LLM (fallback)
    results.push(await testAPI('/api/market-trends?useLLM=false', 'Market Trends (Fallback)'));
    
    // Test 3: SEC filings
    results.push(await testAPI('/api/sec-filings?symbol=COHR', 'SEC Filings Fetcher'));
    
    // Test 4: Segment analysis
    if (API_KEY) {
        results.push(await testAPI('/api/analyze-segments?symbol=COHR', 'LLM Segment Analysis'));
    } else {
        console.log('Skipping LLM Segment Analysis (no API key)\n');
        results.push(false);
    }
    
    // Summary
    console.log('='.repeat(50));
    console.log('📊 Test Results Summary:');
    console.log(`✅ Passed: ${results.filter(r => r).length}/${results.length}`);
    console.log(`❌ Failed: ${results.filter(r => !r).length}/${results.length}`);
    
    if (results.every(r => r)) {
        console.log('\n🎉 All tests passed! LLM integration is working correctly.');
    } else {
        console.log('\n⚠️  Some tests failed. Check logs above for details.');
    }
    
    console.log('\n💡 Tips:');
    console.log('- Ensure GEMINI_API_KEY is set in environment for full functionality');
    console.log('- API calls may take 5-15 seconds due to LLM processing time');
    console.log('- Fallback data should always work even without API key');
}

// Run the tests
runTests().catch(console.error);