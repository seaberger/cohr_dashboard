// Test script to check various free APIs for COHR analyst data
const fetch = require('node-fetch');

async function testYahooFinance() {
    console.log('\n=== Testing Yahoo Finance API ===');
    try {
        // Yahoo Finance has multiple endpoints we can try
        const endpoints = [
            'https://query1.finance.yahoo.com/v10/finance/quoteSummary/COHR?modules=recommendationTrend,financialData,defaultKeyStatistics',
            'https://query1.finance.yahoo.com/v7/finance/options/COHR',
            'https://query1.finance.yahoo.com/v8/finance/chart/COHR?interval=1d&range=1y'
        ];
        
        for (const url of endpoints) {
            try {
                console.log(`\nTesting: ${url}`);
                const response = await fetch(url);
                const data = await response.json();
                
                if (data && data.quoteSummary && data.quoteSummary.result) {
                    const result = data.quoteSummary.result[0];
                    console.log('Available modules:', Object.keys(result));
                    
                    if (result.recommendationTrend) {
                        console.log('Recommendation Trend:', JSON.stringify(result.recommendationTrend, null, 2));
                    }
                    
                    if (result.financialData) {
                        console.log('Financial Data available');
                        if (result.financialData.targetMeanPrice) {
                            console.log('Target Mean Price:', result.financialData.targetMeanPrice);
                        }
                    }
                }
                
            } catch (error) {
                console.log(`Error with ${url}:`, error.message);
            }
        }
        
    } catch (error) {
        console.log('Yahoo Finance test failed:', error.message);
    }
}

async function testAlphaVantageAnalyst() {
    console.log('\n=== Testing Alpha Vantage Analyst ===');
    try {
        // Alpha Vantage sometimes has analyst data in their overview function
        const url = 'https://www.alphavantage.co/query?function=OVERVIEW&symbol=COHR&apikey=demo';
        const response = await fetch(url);
        const data = await response.json();
        
        console.log('Alpha Vantage Overview keys:', Object.keys(data));
        if (data.AnalystTargetPrice) {
            console.log('Analyst Target Price found:', data.AnalystTargetPrice);
        }
        
    } catch (error) {
        console.log('Alpha Vantage test failed:', error.message);
    }
}

async function testFinnhub() {
    console.log('\n=== Testing Finnhub Free Tier ===');
    try {
        // Finnhub free tier sometimes has basic recommendation data
        const demoKey = 'demo'; // They have a demo key
        const url = `https://finnhub.io/api/v1/stock/recommendation?symbol=COHR&token=${demoKey}`;
        const response = await fetch(url);
        const data = await response.json();
        
        console.log('Finnhub recommendation data:', JSON.stringify(data, null, 2));
        
    } catch (error) {
        console.log('Finnhub test failed:', error.message);
    }
}

async function testAll() {
    console.log('Testing free APIs for COHR analyst data...\n');
    
    await testYahooFinance();
    await testAlphaVantageAnalyst();
    await testFinnhub();
    
    console.log('\n=== Test Complete ===');
}

testAll().catch(console.error);