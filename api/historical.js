// Vercel serverless function for historical stock data
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
    const period = req.query.period || '1y'; // 1y, 2y, 6m, 3m
    const interval = req.query.interval || '1d'; // 1d, 1wk, 1mo
    
    try {
      // Calculate period timestamps
      const now = Math.floor(Date.now() / 1000);
      let periodSeconds;
      
      switch(period) {
        case '3m': periodSeconds = 90 * 24 * 60 * 60; break;
        case '6m': periodSeconds = 180 * 24 * 60 * 60; break;
        case '1y': periodSeconds = 365 * 24 * 60 * 60; break;
        case '2y': periodSeconds = 730 * 24 * 60 * 60; break;
        default: periodSeconds = 365 * 24 * 60 * 60; // Default to 1 year
      }
      
      const startTime = now - periodSeconds;
      
      // Fetch historical data from Yahoo Finance
      const yahooResponse = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${startTime}&period2=${now}&interval=${interval}`,
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
      const historicalData = timestamps.map((timestamp, index) => ({
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
      
      // Calculate basic statistics
      const prices = historicalData.map(d => d.close);
      const volumes = historicalData.map(d => d.volume);
      
      const stats = {
        dataPoints: historicalData.length,
        dateRange: {
          start: historicalData[0]?.date,
          end: historicalData[historicalData.length - 1]?.date
        },
        priceRange: {
          min: Math.min(...prices),
          max: Math.max(...prices),
          current: prices[prices.length - 1]
        },
        averageVolume: volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length
      };
      
      const response = {
        symbol: symbol.toUpperCase(),
        period: period,
        interval: interval,
        data: historicalData,
        statistics: stats,
        lastUpdated: new Date().toISOString()
      };
      
      console.log(`Historical data loaded for ${symbol}: ${historicalData.length} data points over ${period}`);
      
      res.status(200).json(response);
      
    } catch (error) {
      console.error('Historical data API error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch historical data',
        message: error.message 
      });
    }
}