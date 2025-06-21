#!/usr/bin/env node

// Script to validate technical analysis calculations
import fetch from 'node-fetch';

const VERCEL_URL = 'https://cohr-dashboard-git-feature-univer-6a9738-sean-bergmans-projects.vercel.app';

async function validateTechnicalAnalysis() {
    console.log('🔍 Validating Technical Analysis for COHR...\n');
    
    try {
        // 1. Fetch technical analysis data
        console.log('1️⃣ Fetching technical analysis data...');
        const technicalResponse = await fetch(`${VERCEL_URL}/api/technical-real?symbol=COHR&period=1y`);
        const technicalData = await technicalResponse.json();
        
        console.log(`   Current Price: $${technicalData.currentPrice}`);
        console.log(`   Data Points: ${technicalData.dataPoints}`);
        console.log(`   Period: ${technicalData.period}\n`);
        
        // 2. Validate Support/Resistance Levels
        console.log('2️⃣ Support & Resistance Levels:');
        console.log('   RESISTANCE:');
        technicalData.levels.resistance.forEach(level => {
            console.log(`   - $${level.price.toFixed(2)} (${level.type}) - ${level.source} - ${level.distance} away`);
        });
        
        console.log('\n   SUPPORT:');
        technicalData.levels.support.forEach(level => {
            console.log(`   - $${level.price.toFixed(2)} (${level.type}) - ${level.source} - ${level.distance} away`);
        });
        
        // 3. Validate Technical Indicators
        console.log('\n3️⃣ Technical Indicators:');
        console.log(`   RSI(14): ${technicalData.indicators.rsi.value} - ${technicalData.indicators.rsi.signal}`);
        console.log(`   MACD: Signal = ${technicalData.indicators.macd.signal}`);
        console.log(`     - MACD Line: ${technicalData.indicators.macd.macd}`);
        console.log(`     - Signal Line: ${technicalData.indicators.macd.signal_line}`);
        console.log(`     - Histogram: ${technicalData.indicators.macd.histogram}`);
        
        // 4. Moving Averages Validation
        console.log('\n4️⃣ Moving Averages:');
        console.log(`   MA(20): $${technicalData.indicators.movingAverages.ma20.toFixed(2)}`);
        console.log(`   MA(50): $${technicalData.indicators.movingAverages.ma50.toFixed(2)}`);
        console.log(`   MA(200): $${technicalData.indicators.movingAverages.ma200.toFixed(2)}`);
        
        // 5. Data Quality Checks
        console.log('\n5️⃣ Data Quality Validation:');
        
        // Check if we have enough data points
        const dataQuality = technicalData.dataPoints >= 200 ? '✅ GOOD' : '⚠️ LIMITED';
        console.log(`   Data Points: ${dataQuality} (${technicalData.dataPoints} days)`);
        
        // Check if levels make sense
        const highestResistance = Math.max(...technicalData.levels.resistance.map(l => l.price));
        const lowestSupport = Math.min(...technicalData.levels.support.map(l => l.price));
        const priceRange = highestResistance - lowestSupport;
        const currentInRange = technicalData.currentPrice > lowestSupport && technicalData.currentPrice < highestResistance;
        
        console.log(`   Price Range: $${lowestSupport.toFixed(2)} - $${highestResistance.toFixed(2)}`);
        console.log(`   Current Price Position: ${currentInRange ? '✅ Within Range' : '⚠️ Outside Range'}`);
        
        // Validate RSI
        const rsiValid = technicalData.indicators.rsi.value >= 0 && technicalData.indicators.rsi.value <= 100;
        console.log(`   RSI Value: ${rsiValid ? '✅ Valid' : '❌ Invalid'} (${technicalData.indicators.rsi.value})`);
        
        // 6. Cross-reference with Yahoo Finance
        console.log('\n6️⃣ Fetching Yahoo Finance data for verification...');
        const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/COHR?interval=1d&range=1y`;
        const yahooResponse = await fetch(yahooUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        if (yahooResponse.ok) {
            const yahooData = await yahooResponse.json();
            const quotes = yahooData.chart.result[0].indicators.quote[0];
            const timestamps = yahooData.chart.result[0].timestamp;
            
            // Find actual highs and lows
            const actualHigh = Math.max(...quotes.high.filter(h => h !== null));
            const actualLow = Math.min(...quotes.low.filter(l => l !== null));
            
            console.log(`   Yahoo Finance 1Y High: $${actualHigh.toFixed(2)}`);
            console.log(`   Yahoo Finance 1Y Low: $${actualLow.toFixed(2)}`);
            console.log(`   Our Highest Resistance: $${highestResistance.toFixed(2)}`);
            console.log(`   Our Lowest Support: $${lowestSupport.toFixed(2)}`);
            
            // Validate our levels are within Yahoo's range
            const resistanceValid = highestResistance <= actualHigh * 1.05; // Allow 5% margin
            const supportValid = lowestSupport >= actualLow * 0.95; // Allow 5% margin
            
            console.log(`\n   Resistance Validation: ${resistanceValid ? '✅ Reasonable' : '⚠️ May be too high'}`);
            console.log(`   Support Validation: ${supportValid ? '✅ Reasonable' : '⚠️ May be too low'}`);
        }
        
        console.log('\n✅ Technical Analysis Validation Complete!');
        
    } catch (error) {
        console.error('❌ Validation failed:', error.message);
    }
}

// Run validation
validateTechnicalAnalysis();