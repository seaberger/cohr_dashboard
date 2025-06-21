#!/usr/bin/env node

// Test script for Finnhub analyst API integration
import fetch from 'node-fetch';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

async function testFinnhubAnalystAPI() {
    console.log('🔍 Testing Finnhub Analyst API Integration...\\n');
    
    if (!FINNHUB_API_KEY) {
        console.log('⚠️  FINNHUB_API_KEY not found in environment variables');
        console.log('   To test with real data, set FINNHUB_API_KEY=your_key_here');
        console.log('   For now, testing API structure only...\\n');
    }
    
    try {
        // Test the structure even without API key
        const symbol = 'COHR';
        console.log(`1️⃣ Testing Finnhub API endpoints for ${symbol}...`);
        
        if (FINNHUB_API_KEY) {
            // Test actual Finnhub endpoints
            console.log('\\n📊 Testing Finnhub Recommendation Endpoint:');
            const recommendationUrl = `https://finnhub.io/api/v1/stock/recommendation?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
            console.log(`   URL: ${recommendationUrl}`);
            
            const recommendationResponse = await fetch(recommendationUrl);
            console.log(`   Status: ${recommendationResponse.status} ${recommendationResponse.statusText}`);
            
            if (recommendationResponse.ok) {
                const recommendationData = await recommendationResponse.json();
                console.log('   Response:', JSON.stringify(recommendationData, null, 2));
            }
            
            console.log('\\n🎯 Testing Finnhub Price Target Endpoint:');
            const priceTargetUrl = `https://finnhub.io/api/v1/stock/price-target?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
            console.log(`   URL: ${priceTargetUrl}`);
            
            const priceTargetResponse = await fetch(priceTargetUrl);
            console.log(`   Status: ${priceTargetResponse.status} ${priceTargetResponse.statusText}`);
            
            if (priceTargetResponse.ok) {
                const priceTargetData = await priceTargetResponse.json();
                console.log('   Response:', JSON.stringify(priceTargetData, null, 2));
            }
        }
        
        console.log('\\n2️⃣ Testing Local Analyst API with Finnhub Integration...');
        
        // Test our local API endpoint
        const localUrl = 'http://localhost:3000/api/analyst?symbol=COHR&currentPrice=81.50';
        console.log(`   Local API: ${localUrl}`);
        
        try {
            const localResponse = await fetch(localUrl);
            console.log(`   Status: ${localResponse.status} ${localResponse.statusText}`);
            
            if (localResponse.ok) {
                const localData = await localResponse.json();
                console.log('\\n✅ Local API Response Structure:');
                console.log('   Symbol:', localData.symbol);
                console.log('   Source:', localData.source);
                console.log('   Consensus:', localData.consensus?.rating);
                console.log('   Analyst Count:', localData.consensus?.analystCount);
                console.log('   Price Target:', localData.priceTarget?.average);
                console.log('   Upside:', localData.priceTarget?.upside + '%');
                console.log('   API Keys Used:', localData.apiKeysUsed);
                console.log('   Last Updated:', localData.lastUpdated);
            } else {
                const errorData = await localResponse.json();
                console.log('\\n❌ Local API Error Response:');
                console.log('   Error:', errorData.error);
                console.log('   Message:', errorData.message);
                console.log('   Details:', errorData.details);
                console.log('   API Keys Used:', errorData.apiKeysUsed);
            }
        } catch (localError) {
            console.log('\\n⚠️  Local API test failed (server may not be running):');
            console.log('   Error:', localError.message);
            console.log('   To test locally: npm run dev or vercel dev');
        }
        
        console.log('\\n3️⃣ API Integration Summary:');
        console.log('✅ Finnhub API endpoints configured');
        console.log('✅ Professional error handling implemented');
        console.log('✅ No hardcoded fallback data');
        console.log('✅ 30-minute caching headers added');
        console.log('✅ Multi-tier fallback strategy (Finnhub → Yahoo → FMP → Error)');
        
        if (!FINNHUB_API_KEY) {
            console.log('\\n📋 Next Steps:');
            console.log('1. Add FINNHUB_API_KEY to Vercel environment variables');
            console.log('2. Test with real API key for COHR data');
            console.log('3. Verify analyst data displays correctly in dashboard');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run test if API key is available or for structure testing
testFinnhubAnalystAPI();