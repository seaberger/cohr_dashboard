// Technical Analysis Library for Support/Resistance Calculation

/**
 * Find swing highs in price data
 * @param {Array} data - Array of OHLCV objects
 * @param {number} lookback - Number of periods to look back/forward for confirmation
 * @returns {Array} Array of swing high objects with price, index, and strength
 */
export function findSwingHighs(data, lookback = 5) {
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
        index: i,
        strength: strength,
        volume: data[i].volume,
        type: 'resistance'
      });
    }
  }
  
  return swingHighs.sort((a, b) => b.strength - a.strength); // Sort by strength descending
}

/**
 * Find swing lows in price data
 * @param {Array} data - Array of OHLCV objects
 * @param {number} lookback - Number of periods to look back/forward for confirmation
 * @returns {Array} Array of swing low objects with price, index, and strength
 */
export function findSwingLows(data, lookback = 5) {
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
        index: i,
        strength: strength,
        volume: data[i].volume,
        type: 'support'
      });
    }
  }
  
  return swingLows.sort((a, b) => b.strength - a.strength); // Sort by strength descending
}

/**
 * Calculate moving average levels that act as dynamic support/resistance
 * @param {Array} data - Array of OHLCV objects
 * @param {Array} periods - Array of periods to calculate (e.g., [20, 50, 200])
 * @returns {Object} Object with moving average values and their significance
 */
export function calculateMovingAverages(data, periods = [20, 50, 100, 200]) {
  const movingAverages = {};
  
  periods.forEach(period => {
    if (data.length >= period) {
      const recentPrices = data.slice(-period).map(d => d.close);
      const ma = recentPrices.reduce((sum, price) => sum + price, 0) / period;
      
      // Determine if MA is acting as support or resistance
      const currentPrice = data[data.length - 1].close;
      const position = currentPrice > ma ? 'support' : 'resistance';
      
      // Calculate how often price has respected this MA recently
      let respectCount = 0;
      const testPeriod = Math.min(50, data.length - period);
      
      for (let i = data.length - testPeriod; i < data.length; i++) {
        const dayData = data[i];
        const maPrices = data.slice(i - period + 1, i + 1).map(d => d.close);
        const dayMA = maPrices.reduce((sum, p) => sum + p, 0) / period;
        
        // Check if price bounced off MA (touched but didn't close significantly beyond)
        if (position === 'support' && dayData.low <= dayMA * 1.02 && dayData.close > dayMA) {
          respectCount++;
        } else if (position === 'resistance' && dayData.high >= dayMA * 0.98 && dayData.close < dayMA) {
          respectCount++;
        }
      }
      
      movingAverages[`MA${period}`] = {
        price: parseFloat(ma.toFixed(2)),
        period: period,
        position: position,
        strength: respectCount / testPeriod,
        type: position,
        significance: period >= 200 ? 'high' : period >= 50 ? 'medium' : 'low'
      };
    }
  });
  
  return movingAverages;
}

/**
 * Calculate volume profile to find high-volume price levels
 * @param {Array} data - Array of OHLCV objects
 * @param {number} buckets - Number of price buckets to create
 * @returns {Array} Array of volume profile levels
 */
export function calculateVolumeProfile(data, buckets = 20) {
  const prices = data.map(d => d.close);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const bucketSize = (maxPrice - minPrice) / buckets;
  
  const volumeProfile = [];
  
  for (let i = 0; i < buckets; i++) {
    const bucketMin = minPrice + (i * bucketSize);
    const bucketMax = bucketMin + bucketSize;
    const bucketMid = (bucketMin + bucketMax) / 2;
    
    let totalVolume = 0;
    let dataPoints = 0;
    
    data.forEach(candle => {
      // Check if any part of the candle (OHLC) falls in this bucket
      if ((candle.low <= bucketMax && candle.high >= bucketMin)) {
        totalVolume += candle.volume;
        dataPoints++;
      }
    });
    
    if (dataPoints > 0) {
      volumeProfile.push({
        price: parseFloat(bucketMid.toFixed(2)),
        volume: totalVolume,
        dataPoints: dataPoints,
        priceRange: { min: bucketMin, max: bucketMax }
      });
    }
  }
  
  // Sort by volume descending and return top volume areas
  return volumeProfile
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 10) // Top 10 volume areas
    .map((level, index) => ({
      ...level,
      type: 'volume',
      strength: (10 - index) / 10, // Strength based on volume ranking
      significance: index < 3 ? 'high' : index < 6 ? 'medium' : 'low'
    }));
}

/**
 * Calculate psychological levels (round numbers)
 * @param {number} currentPrice - Current stock price
 * @param {number} range - Price range to look for levels (default 20%)
 * @returns {Array} Array of psychological level objects
 */
export function calculatePsychologicalLevels(currentPrice, range = 0.2) {
  const levels = [];
  const minPrice = currentPrice * (1 - range);
  const maxPrice = currentPrice * (1 + range);
  
  // Find round numbers within range
  const roundNumbers = [];
  
  // $5 increments for prices under $50
  if (currentPrice < 50) {
    for (let price = 5; price <= maxPrice + 10; price += 5) {
      if (price >= minPrice && price <= maxPrice && price !== currentPrice) {
        roundNumbers.push(price);
      }
    }
  }
  // $10 increments for prices $50-$200
  else if (currentPrice < 200) {
    for (let price = 10; price <= maxPrice + 20; price += 10) {
      if (price >= minPrice && price <= maxPrice && Math.abs(price - currentPrice) > 2) {
        roundNumbers.push(price);
      }
    }
  }
  // $25 increments for prices above $200
  else {
    for (let price = 25; price <= maxPrice + 50; price += 25) {
      if (price >= minPrice && price <= maxPrice && Math.abs(price - currentPrice) > 5) {
        roundNumbers.push(price);
      }
    }
  }
  
  return roundNumbers.map(price => ({
    price: price,
    type: price > currentPrice ? 'resistance' : 'support',
    strength: 0.3, // Moderate strength for psychological levels
    significance: 'low',
    description: `Psychological ${price > currentPrice ? 'resistance' : 'support'} at $${price}`
  }));
}

/**
 * Combine all support and resistance levels and rank by significance
 * @param {Array} historicalData - Array of OHLCV objects
 * @param {number} currentPrice - Current stock price
 * @returns {Object} Object with ranked support and resistance levels
 */
export function calculateSupportResistance(historicalData, currentPrice) {
  const swingHighs = findSwingHighs(historicalData, 5);
  const swingLows = findSwingLows(historicalData, 5);
  const movingAverages = calculateMovingAverages(historicalData);
  const volumeProfile = calculateVolumeProfile(historicalData);
  const psychologicalLevels = calculatePsychologicalLevels(currentPrice);
  
  // Combine all resistance levels
  const resistanceLevels = [
    ...swingHighs.filter(level => level.price > currentPrice).slice(0, 5),
    ...Object.values(movingAverages).filter(ma => ma.position === 'resistance'),
    ...volumeProfile.filter(level => level.price > currentPrice).slice(0, 3),
    ...psychologicalLevels.filter(level => level.type === 'resistance')
  ].sort((a, b) => a.price - b.price); // Sort by price ascending
  
  // Combine all support levels
  const supportLevels = [
    ...swingLows.filter(level => level.price < currentPrice).slice(0, 5),
    ...Object.values(movingAverages).filter(ma => ma.position === 'support'),
    ...volumeProfile.filter(level => level.price < currentPrice).slice(0, 3),
    ...psychologicalLevels.filter(level => level.type === 'support')
  ].sort((a, b) => b.price - a.price); // Sort by price descending
  
  // Add distance and relevance scoring
  const addRelevanceScore = (levels, type) => {
    return levels.map(level => {
      const distance = Math.abs(level.price - currentPrice) / currentPrice;
      const proximityScore = Math.max(0, 1 - (distance * 5)); // Closer levels score higher
      const overallScore = (level.strength || 0.5) * 0.7 + proximityScore * 0.3;
      
      return {
        ...level,
        distance: parseFloat((distance * 100).toFixed(1)), // Distance as percentage
        proximityScore: parseFloat(proximityScore.toFixed(2)),
        overallScore: parseFloat(overallScore.toFixed(2)),
        type: type
      };
    });
  };
  
  return {
    resistance: addRelevanceScore(resistanceLevels, 'resistance').slice(0, 6),
    support: addRelevanceScore(supportLevels, 'support').slice(0, 6),
    movingAverages: movingAverages,
    analysis: {
      totalDataPoints: historicalData.length,
      swingHighsFound: swingHighs.length,
      swingLowsFound: swingLows.length,
      volumeLevelsFound: volumeProfile.length,
      currentPrice: currentPrice,
      lastUpdated: new Date().toISOString()
    }
  };
}