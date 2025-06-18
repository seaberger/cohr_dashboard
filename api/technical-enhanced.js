// Enhanced technical analysis with real support/resistance levels
import { calculateSupportResistance } from '../lib/technicalAnalysis.js';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
  
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    const symbol = req.query.symbol || process.env.DEFAULT_SYMBOL || 'COHR';
    const period = req.query.period || '1y';
    
    try {
      // Fetch historical data for technical analysis
      const baseUrl = req.headers.host ? `https://${req.headers.host}` : 'http://localhost:3000';
      const historicalResponse = await fetch(`${baseUrl}/api/historical?symbol=${symbol}&period=${period}`);
      
      if (!historicalResponse.ok) {
        throw new Error('Failed to fetch historical data');
      }
      
      const historicalData = await historicalResponse.json();
      
      if (!historicalData.data || historicalData.data.length === 0) {
        throw new Error('No historical data available');
      }
      
      const data = historicalData.data;
      const currentPrice = data[data.length - 1].close;
      
      // Calculate real support and resistance levels
      const supportResistance = calculateSupportResistance(data, currentPrice);
      
      // Calculate additional technical indicators from historical data
      const technicalIndicators = calculateTechnicalIndicators(data);
      
      // Combine with existing technical analysis for backward compatibility
      const response = {
        symbol: symbol.toUpperCase(),
        currentPrice: currentPrice,
        period: period,
        dataPoints: data.length,
        
        // Enhanced support and resistance with real analysis
        levels: {
          resistance: supportResistance.resistance.map(level => ({
            price: parseFloat(level.price.toFixed(2)),
            strength: level.strength || level.overallScore,
            type: level.type || 'swing_high',
            distance: `${level.distance}%`,
            significance: level.significance || 'medium',
            source: getSourceDescription(level),
            testCount: level.testCount || null,
            volume: level.volume || null
          })),
          support: supportResistance.support.map(level => ({
            price: parseFloat(level.price.toFixed(2)),
            strength: level.strength || level.overallScore,
            type: level.type || 'swing_low',
            distance: `${level.distance}%`,
            significance: level.significance || 'medium',
            source: getSourceDescription(level),
            testCount: level.testCount || null,
            volume: level.volume || null
          }))
        },
        
        // Moving averages as dynamic support/resistance
        movingAverages: supportResistance.movingAverages,
        
        // Traditional technical indicators
        indicators: technicalIndicators,
        
        // Analysis summary
        analysis: {
          ...supportResistance.analysis,
          trend: determineTrend(data, supportResistance.movingAverages),
          volatility: calculateVolatility(data),
          momentum: calculateMomentum(data)
        },
        
        lastUpdated: new Date().toISOString()
      };
      
      console.log(`Enhanced technical analysis completed for ${symbol}: ${data.length} data points, ${response.levels.resistance.length} resistance, ${response.levels.support.length} support levels`);
      
      res.status(200).json(response);
      
    } catch (error) {
      console.error('Enhanced technical analysis error:', error);
      res.status(500).json({ 
        error: 'Failed to calculate enhanced technical analysis',
        message: error.message 
      });
    }
}

function getSourceDescription(level) {
  if (level.period) return `${level.period}-day Moving Average`;
  if (level.type === 'volume') return 'High Volume Area';
  if (level.description) return level.description;
  if (level.type === 'resistance') return 'Swing High';
  if (level.type === 'support') return 'Swing Low';
  return 'Technical Level';
}

function calculateTechnicalIndicators(data) {
  const prices = data.map(d => d.close);
  const currentPrice = prices[prices.length - 1];
  
  // RSI calculation (simplified 14-period)
  const rsi = calculateRSI(prices, 14);
  
  // MACD calculation (simplified)
  const macd = calculateMACD(prices);
  
  // Volume analysis
  const volumes = data.map(d => d.volume);
  const avgVolume = volumes.slice(-20).reduce((sum, vol) => sum + vol, 0) / 20;
  const currentVolume = volumes[volumes.length - 1];
  
  return {
    rsi: {
      value: rsi.toFixed(1),
      signal: rsi < 30 ? 'Oversold' : rsi > 70 ? 'Overbought' : 'Neutral',
      class: rsi < 30 ? 'bullish' : rsi > 70 ? 'bearish' : 'neutral',
      description: 'Relative Strength Index (14-period)'
    },
    macd: {
      value: macd.toFixed(3),
      signal: macd > 0 ? 'Bullish' : macd < 0 ? 'Bearish' : 'Neutral',
      class: macd > 0 ? 'bullish' : 'bearish',
      description: 'MACD Signal'
    },
    volume: {
      value: Math.round(currentVolume).toLocaleString(),
      signal: currentVolume > avgVolume ? 'Above Average' : 'Below Average',
      class: currentVolume > avgVolume ? 'bullish' : 'bearish',
      description: 'Volume vs 20-day Average',
      ratio: (currentVolume / avgVolume).toFixed(2)
    }
  };
}

function calculateRSI(prices, period = 14) {
  if (prices.length < period + 1) return 50; // Default neutral RSI
  
  let gains = 0;
  let losses = 0;
  
  // Calculate initial gains and losses
  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  return Math.max(0, Math.min(100, rsi));
}

function calculateMACD(prices) {
  if (prices.length < 26) return 0;
  
  // Simplified MACD calculation
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  
  return ema12 - ema26;
}

function calculateEMA(prices, period) {
  if (prices.length < period) return prices[prices.length - 1];
  
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(-period, -period + 1)[0]; // Start with SMA
  
  for (let i = prices.length - period + 1; i < prices.length; i++) {
    ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
  }
  
  return ema;
}

function determineTrend(data, movingAverages) {
  const currentPrice = data[data.length - 1].close;
  const priceChange20 = ((currentPrice - data[data.length - 21].close) / data[data.length - 21].close) * 100;
  
  let bullishSignals = 0;
  let totalSignals = 0;
  
  // Check moving average signals
  Object.values(movingAverages).forEach(ma => {
    totalSignals++;
    if (ma.position === 'support') bullishSignals++;
  });
  
  // Check price momentum
  totalSignals++;
  if (priceChange20 > 0) bullishSignals++;
  
  const bullishPercentage = bullishSignals / totalSignals;
  
  let trend = 'Neutral';
  let trendClass = 'neutral';
  
  if (bullishPercentage >= 0.7) {
    trend = 'Strong Bullish';
    trendClass = 'bullish';
  } else if (bullishPercentage >= 0.5) {
    trend = 'Bullish';
    trendClass = 'bullish';
  } else if (bullishPercentage <= 0.3) {
    trend = 'Bearish';
    trendClass = 'bearish';
  }
  
  return {
    direction: trend,
    class: trendClass,
    strength: bullishPercentage,
    momentum: priceChange20.toFixed(2) + '%'
  };
}

function calculateVolatility(data) {
  if (data.length < 20) return { value: 0, description: 'Insufficient data' };
  
  const prices = data.slice(-20).map(d => d.close);
  const returns = [];
  
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  
  const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized volatility
  
  let description = 'Normal';
  if (volatility > 40) description = 'High';
  else if (volatility > 25) description = 'Moderate';
  else if (volatility < 15) description = 'Low';
  
  return {
    value: volatility.toFixed(1) + '%',
    description: description,
    raw: volatility
  };
}

function calculateMomentum(data) {
  if (data.length < 10) return { value: 0, description: 'Insufficient data' };
  
  const currentPrice = data[data.length - 1].close;
  const price10DaysAgo = data[data.length - 11].close;
  const momentum = ((currentPrice - price10DaysAgo) / price10DaysAgo) * 100;
  
  let description = 'Neutral';
  let momentumClass = 'neutral';
  
  if (momentum > 5) {
    description = 'Strong Positive';
    momentumClass = 'bullish';
  } else if (momentum > 1) {
    description = 'Positive';
    momentumClass = 'bullish';
  } else if (momentum < -5) {
    description = 'Strong Negative';
    momentumClass = 'bearish';
  } else if (momentum < -1) {
    description = 'Negative';
    momentumClass = 'bearish';
  }
  
  return {
    value: momentum.toFixed(2) + '%',
    description: description,
    class: momentumClass,
    raw: momentum
  };
}