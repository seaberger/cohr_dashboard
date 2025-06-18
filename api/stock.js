// Vercel serverless function for stock data
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
  
    try {
      let stockData = null;
  
      // Method 1: Try Yahoo Finance Chart API (real-time quotes)
      try {
        // Use chart API to get current price - it doesn't require authentication
        const now = Math.floor(Date.now() / 1000);
        const fiveMinutesAgo = now - 300;
        
        const yahooResponse = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${fiveMinutesAgo}&period2=${now}&interval=1m&includePrePost=true`,
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
  
        if (yahooData.chart?.result?.[0]?.meta) {
          const meta = yahooData.chart.result[0].meta;
          const price = meta.regularMarketPrice;
          const previousClose = meta.chartPreviousClose || meta.previousClose;
          const change = price - previousClose;
          const changePercent = (change / previousClose) * 100;
          
          stockData = {
            price: price,
            change: change,
            changePercent: changePercent,
            high: meta.regularMarketDayHigh || price,
            low: meta.regularMarketDayLow || price,
            open: meta.regularMarketOpen || price,
            previousClose: previousClose,
            volume: meta.regularMarketVolume || 0,
            source: 'Yahoo Finance',
            timestamp: new Date().toISOString()
          };
        }
      } catch (error) {
        console.log('Yahoo Finance failed:', error.message);
      }
  
      // Method 2: Try Finnhub API (if Yahoo fails)
      if (!stockData) {
        try {
          const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || 'sandbox_c39p461r01qghv5ktobgc39p461r01qghv5ktoc0';
          const finnhubResponse = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
          );
          const finnhubData = await finnhubResponse.json();
    
          if (finnhubData.c && finnhubData.c > 0) {
            stockData = {
              price: finnhubData.c,
              change: finnhubData.d,
              changePercent: finnhubData.dp,
              high: finnhubData.h,
              low: finnhubData.l,
              open: finnhubData.o,
              previousClose: finnhubData.pc,
              source: 'Finnhub',
              timestamp: new Date().toISOString()
            };
          }
        } catch (error) {
          console.log('Finnhub failed:', error.message);
        }
      }
  
      // Method 3: Try Alpha Vantage API (if others fail)
      if (!stockData) {
        try {
          const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_API_KEY;
          if (ALPHA_VANTAGE_KEY) {
            const avResponse = await fetch(
              `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`
            );
            const avData = await avResponse.json();
  
            if (avData['Global Quote'] && avData['Global Quote']['05. price']) {
              const quote = avData['Global Quote'];
              stockData = {
                price: parseFloat(quote['05. price']),
                change: parseFloat(quote['09. change']),
                changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
                high: parseFloat(quote['03. high']),
                low: parseFloat(quote['04. low']),
                open: parseFloat(quote['02. open']),
                previousClose: parseFloat(quote['08. previous close']),
                volume: parseInt(quote['06. volume']),
                source: 'Alpha Vantage',
                timestamp: new Date().toISOString()
              };
            }
          }
        } catch (error) {
          console.log('Alpha Vantage failed:', error.message);
        }
      }
  
      // Method 4: Try IEX Cloud (if others fail)
      if (!stockData) {
        try {
          const IEX_TOKEN = process.env.IEX_API_KEY || 'pk_test_c4f40a8a0b2346b8baa6b4e7b4e7b4e7';
          const iexResponse = await fetch(
            `https://cloud.iexapis.com/stable/stock/${symbol}/quote?token=${IEX_TOKEN}`
          );
          const iexData = await iexResponse.json();
  
          if (iexData.latestPrice) {
            stockData = {
              price: iexData.latestPrice,
              change: iexData.change,
              changePercent: iexData.changePercent * 100,
              high: iexData.high,
              low: iexData.low,
              open: iexData.open,
              previousClose: iexData.previousClose,
              volume: iexData.latestVolume,
              marketCap: iexData.marketCap,
              source: 'IEX Cloud',
              timestamp: new Date().toISOString()
            };
          }
        } catch (error) {
          console.log('IEX Cloud failed:', error.message);
        }
      }
  
      // Method 5: Polygon.io - DISABLED: uses /prev endpoint which returns yesterday's data
      // To re-enable with real-time data, replace the URL with:
      // `https://api.polygon.io/v1/last/stocks/${symbol}?apikey=${POLYGON_API_KEY}`
      /*
      if (!stockData) {
        try {
          const POLYGON_API_KEY = process.env.POLYGON_API_KEY || 'demo';
          const polygonResponse = await fetch(
            `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apikey=${POLYGON_API_KEY}`
          );
          const polygonData = await polygonResponse.json();
  
          if (polygonData.results && polygonData.results[0]) {
            const result = polygonData.results[0];
            const price = result.c; // close price
            const open = result.o; // open price
            const change = price - open;
            const changePercent = (change / open) * 100;
  
            stockData = {
              price: price,
              change: change,
              changePercent: changePercent,
              high: result.h,
              low: result.l,
              open: open,
              previousClose: open, // approximation
              volume: result.v,
              source: 'Polygon.io',
              timestamp: new Date().toISOString()
            };
          }
        } catch (error) {
          console.log('Polygon.io failed:', error.message);
        }
      }
      */
  
      // Fallback data if all APIs fail
      if (!stockData) {
        const basePrice = 81.07;
        const randomChange = (Math.random() - 0.5) * 4;
        const currentPrice = basePrice + randomChange;
        const changePercent = (randomChange / basePrice) * 100;
  
        stockData = {
          price: currentPrice,
          change: randomChange,
          changePercent: changePercent,
          high: currentPrice * 1.02,
          low: currentPrice * 0.98,
          open: currentPrice - (randomChange * 0.5),
          previousClose: basePrice,
          volume: 1500000 + Math.floor(Math.random() * 500000),
          source: 'Demo Data',
          timestamp: new Date().toISOString()
        };
      }
  
      // Calculate additional metrics
      const shares = 155; // Million shares outstanding
      const marketCap = (stockData.price * shares / 1000).toFixed(1);
  
      const response = {
        ...stockData,
        symbol: symbol.toUpperCase(),
        marketCapBillions: marketCap,
        lastUpdated: new Date().toISOString(),
        apiKeysUsed: {
          alphavantage: !!process.env.ALPHA_VANTAGE_API_KEY,
          finnhub: !!process.env.FINNHUB_API_KEY,
          iex: !!process.env.IEX_API_KEY,
          polygon: !!process.env.POLYGON_API_KEY
        }
      };
  
      res.status(200).json(response);
    } catch (error) {
      console.error('Stock API error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch stock data',
        message: error.message 
      });
    }
  }