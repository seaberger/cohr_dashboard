// Enhanced technical analysis with embedded calculations (Vercel-compatible)
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
      // Fetch historical data directly from Yahoo Finance
      const now = Math.floor(Date.now() / 1000);
      let periodSeconds;
      
      switch(period) {
        case '3m': periodSeconds = 90 * 24 * 60 * 60; break;
        case '6m': periodSeconds = 180 * 24 * 60 * 60; break;
        case '1y': periodSeconds = 365 * 24 * 60 * 60; break;
        case '2y': periodSeconds = 730 * 24 * 60 * 60; break;
        default: periodSeconds = 365 * 24 * 60 * 60;
      }
      
      const startTime = now - periodSeconds;
      
      console.log(`Fetching ${period} historical data for ${symbol}...`);
      
      // Fetch historical data directly from Yahoo Finance
      const yahooResponse = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${startTime}&period2=${now}&interval=1d`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        }
      );
      
      if (!yahooResponse.ok) {
        throw new Error(`Yahoo Finance API error: ${yahooResponse.status}`);
      }
      
      const yahooData = await yahooResponse.json();
      
      if (!yahooData.chart || !yahooData.chart.result || yahooData.chart.result.length === 0) {
        throw new Error('No historical data available');
      }
      
      const result = yahooData.chart.result[0];
      const timestamps = result.timestamp;
      const quotes = result.indicators.quote[0];
      
      // Format data into OHLCV format
      const data = timestamps.map((timestamp, index) => ({
        date: new Date(timestamp * 1000).toISOString().split('T')[0],
        timestamp: timestamp,
        open: quotes.open[index],
        high: quotes.high[index],
        low: quotes.low[index],
        close: quotes.close[index],
        volume: quotes.volume[index]
      })).filter(candle => 
        // Filter out invalid data points
        candle.open !== null && 
        candle.high !== null && 
        candle.low !== null && 
        candle.close !== null &&
        candle.volume !== null
      );
      
      if (data.length === 0) {
        throw new Error('No valid historical data points');
      }
      
      console.log(`Historical data loaded: ${data.length} data points`);
      
      const currentPrice = data[data.length - 1].close;
      
      // Calculate real support and resistance levels
      const supportResistance = calculateRealSupportResistance(data, currentPrice);
      
      // Calculate technical indicators from historical data
      const technicalIndicators = calculateRealTechnicalIndicators(data);
      
      const response = {
        symbol: symbol.toUpperCase(),
        currentPrice: currentPrice,
        period: period,
        dataPoints: data.length,
        
        // Enhanced support and resistance with real analysis
        levels: {
          resistance: supportResistance.resistance.map(level => ({
            price: parseFloat(level.price.toFixed(2)),
            strength: level.strength || level.overallScore || 0.5,
            type: level.source || level.type || 'swing_high',
            distance: `${level.distance}%`,
            significance: level.significance || 'medium',
            source: getSourceDescription(level)
          })),
          support: supportResistance.support.map(level => ({
            price: parseFloat(level.price.toFixed(2)),
            strength: level.strength || level.overallScore || 0.5,
            type: level.source || level.type || 'swing_low', 
            distance: `${level.distance}%`,
            significance: level.significance || 'medium',
            source: getSourceDescription(level)
          }))
        },
        
        // Traditional technical indicators
        indicators: technicalIndicators,
        
        // Analysis summary
        analysis: {
          ...supportResistance.analysis,
          trend: determineTrend(data),
          volatility: calculateVolatility(data)
        },
        
        lastUpdated: new Date().toISOString()
      };
      
      console.log(`Enhanced technical analysis completed for ${symbol}: ${response.levels.resistance.length} resistance, ${response.levels.support.length} support levels`);
      
      res.status(200).json(response);
      
    } catch (error) {
      console.error('Enhanced technical analysis error:', error);
      res.status(500).json({ 
        error: 'Failed to calculate enhanced technical analysis',
        message: error.message,
        symbol: symbol,
        fallback: 'Use /api/technical for basic analysis'
      });
    }
}

// Embedded technical analysis functions (simplified for Vercel)
function calculateRealSupportResistance(data, currentPrice) {
  const swingHighs = findSwingHighs(data, 5);
  const swingLows = findSwingLows(data, 5);
  const movingAverages = calculateMovingAverages(data);
  
  // Combine resistance levels
  const resistanceLevels = [
    ...swingHighs.filter(level => level.price > currentPrice).slice(0, 4),
    ...Object.values(movingAverages).filter(ma => ma.position === 'resistance').slice(0, 2)
  ].sort((a, b) => a.price - b.price);
  
  // Combine support levels  
  const supportLevels = [
    ...swingLows.filter(level => level.price < currentPrice).slice(0, 4),
    ...Object.values(movingAverages).filter(ma => ma.position === 'support').slice(0, 2)
  ].sort((a, b) => b.price - a.price);
  
  // Add distance scoring
  const addDistanceScore = (levels) => {
    return levels.map(level => {
      const distance = Math.abs(level.price - currentPrice) / currentPrice;
      return {
        ...level,
        distance: parseFloat((distance * 100).toFixed(1)),
        overallScore: level.strength || 0.5
      };
    });
  };
  
  return {
    resistance: addDistanceScore(resistanceLevels).slice(0, 5),
    support: addDistanceScore(supportLevels).slice(0, 5),
    analysis: {
      totalDataPoints: data.length,
      swingHighsFound: swingHighs.length,
      swingLowsFound: swingLows.length,
      currentPrice: currentPrice,
      lastUpdated: new Date().toISOString()
    }
  };
}

function findSwingHighs(data, lookback = 5) {
  const swingHighs = [];
  
  for (let i = lookback; i < data.length - lookback; i++) {
    const currentHigh = data[i].high;
    let isSwingHigh = true;
    
    // Check if current high is higher than lookback periods before and after
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j !== i && data[j].high >= currentHigh) {
        isSwingHigh = false;
        break;
      }
    }
    
    if (isSwingHigh) {
      // Calculate strength based on how much higher it is than surrounding highs
      const surroundingHighs = [];
      for (let j = i - lookback; j <= i + lookback; j++) {
        if (j !== i) surroundingHighs.push(data[j].high);
      }
      const avgSurrounding = surroundingHighs.reduce((sum, h) => sum + h, 0) / surroundingHighs.length;
      const strength = ((currentHigh - avgSurrounding) / avgSurrounding) * 100;
      
      swingHighs.push({
        price: currentHigh,
        date: data[i].date,
        strength: Math.max(0.1, strength / 100), // Normalize to 0-1
        source: 'swing_high',
        type: 'resistance'
      });
    }
  }
  
  return swingHighs.sort((a, b) => b.strength - a.strength);
}

function findSwingLows(data, lookback = 5) {
  const swingLows = [];
  
  for (let i = lookback; i < data.length - lookback; i++) {
    const currentLow = data[i].low;
    let isSwingLow = true;
    
    // Check if current low is lower than lookback periods before and after
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j !== i && data[j].low <= currentLow) {
        isSwingLow = false;
        break;
      }
    }
    
    if (isSwingLow) {
      // Calculate strength based on how much lower it is than surrounding lows
      const surroundingLows = [];
      for (let j = i - lookback; j <= i + lookback; j++) {
        if (j !== i) surroundingLows.push(data[j].low);
      }
      const avgSurrounding = surroundingLows.reduce((sum, l) => sum + l, 0) / surroundingLows.length;
      const strength = ((avgSurrounding - currentLow) / avgSurrounding) * 100;
      
      swingLows.push({
        price: currentLow,
        date: data[i].date,
        strength: Math.max(0.1, strength / 100), // Normalize to 0-1
        source: 'swing_low',
        type: 'support'
      });
    }
  }
  
  return swingLows.sort((a, b) => b.strength - a.strength);
}

function calculateMovingAverages(data, periods = [20, 50, 200]) {
  const movingAverages = {};
  
  periods.forEach(period => {
    if (data.length >= period) {
      const recentPrices = data.slice(-period).map(d => d.close);
      const ma = recentPrices.reduce((sum, price) => sum + price, 0) / period;
      
      // Determine if MA is acting as support or resistance
      const currentPrice = data[data.length - 1].close;
      const position = currentPrice > ma ? 'support' : 'resistance';
      
      movingAverages[`MA${period}`] = {
        price: parseFloat(ma.toFixed(2)),
        period: period,
        position: position,
        strength: 0.6, // Fixed strength for MAs
        type: position,
        source: `ma_${period}`,
        significance: period >= 200 ? 'high' : period >= 50 ? 'medium' : 'low'
      };
    }
  });
  
  return movingAverages;
}

function calculateRealTechnicalIndicators(data) {
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
      description: 'RSI (14-period) - Real Calculation'
    },
    macd: {
      value: macd.toFixed(3),
      signal: macd > 0 ? 'Bullish' : 'Bearish',
      class: macd > 0 ? 'bullish' : 'bearish',
      description: 'MACD - Real Calculation'
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
  if (prices.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
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
  
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  
  return ema12 - ema26;
}

function calculateEMA(prices, period) {
  if (prices.length < period) return prices[prices.length - 1];
  
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(-period, -period + 1)[0]; // Start with first price
  
  for (let i = prices.length - period + 1; i < prices.length; i++) {
    ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
  }
  
  return ema;
}

function determineTrend(data) {
  const currentPrice = data[data.length - 1].close;
  const price20DaysAgo = data[data.length - 21]?.close || currentPrice;
  const priceChange = ((currentPrice - price20DaysAgo) / price20DaysAgo) * 100;
  
  let trend = 'Neutral';
  let trendClass = 'neutral';
  
  if (priceChange > 5) {
    trend = 'Strong Bullish';
    trendClass = 'bullish';
  } else if (priceChange > 1) {
    trend = 'Bullish';
    trendClass = 'bullish';
  } else if (priceChange < -5) {
    trend = 'Strong Bearish';
    trendClass = 'bearish';
  } else if (priceChange < -1) {
    trend = 'Bearish';
    trendClass = 'bearish';
  }
  
  return {
    direction: trend,
    class: trendClass,
    momentum: priceChange.toFixed(2) + '%'
  };
}

function calculateVolatility(data) {
  if (data.length < 20) return { value: '0%', description: 'Insufficient data' };
  
  const prices = data.slice(-20).map(d => d.close);
  const returns = [];
  
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  
  const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100;
  
  let description = 'Normal';
  if (volatility > 40) description = 'High';
  else if (volatility > 25) description = 'Moderate';
  else if (volatility < 15) description = 'Low';
  
  return {
    value: volatility.toFixed(1) + '%',
    description: description
  };
}

function getSourceDescription(level) {
  if (level.period) return `${level.period}-day Moving Average`;
  if (level.source === 'swing_high') return 'Swing High';
  if (level.source === 'swing_low') return 'Swing Low';
  if (level.source && level.source.startsWith('ma_')) return `${level.source.split('_')[1]}-day MA`;
  return 'Technical Level';
}