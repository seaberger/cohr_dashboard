// Test endpoint to debug FMP API responses
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
  
    const symbol = req.query.symbol || 'COHR';
    const FMP_API_KEY = process.env.FINANCIAL_MODELING_PREP_API_KEY;
    
    if (!FMP_API_KEY) {
        return res.status(200).json({
            error: 'FMP API key not configured in Vercel environment variables',
            instructions: 'Add FINANCIAL_MODELING_PREP_API_KEY to Vercel dashboard',
            symbol: symbol
        });
    }
    
    try {
        // Test the exact FMP endpoints for COHR
        const endpoints = [
            {
                name: 'analyst-stock-recommendations',
                url: `https://financialmodelingprep.com/api/v3/analyst-stock-recommendations/${symbol}?apikey=${FMP_API_KEY}`
            },
            {
                name: 'price-target',
                url: `https://financialmodelingprep.com/api/v3/price-target?symbol=${symbol}&apikey=${FMP_API_KEY}`
            },
            {
                name: 'upgrades-downgrades',
                url: `https://financialmodelingprep.com/api/v3/upgrades-downgrades?symbol=${symbol}&apikey=${FMP_API_KEY}`
            },
            {
                name: 'analyst-estimates',
                url: `https://financialmodelingprep.com/api/v3/analyst-estimates/${symbol}?apikey=${FMP_API_KEY}`
            }
        ];
        
        const results = {};
        
        for (const endpoint of endpoints) {
            try {
                const response = await fetch(endpoint.url);
                const data = await response.json();
                results[endpoint.name] = {
                    status: response.status,
                    dataLength: Array.isArray(data) ? data.length : 'not_array',
                    sample: Array.isArray(data) && data.length > 0 ? data[0] : data,
                    url: endpoint.url.replace(FMP_API_KEY, '[API_KEY_HIDDEN]')
                };
            } catch (error) {
                results[endpoint.name] = {
                    error: error.message,
                    url: endpoint.url.replace(FMP_API_KEY, '[API_KEY_HIDDEN]')
                };
            }
        }
        
        res.status(200).json({
            symbol: symbol,
            apiKeyConfigured: !!FMP_API_KEY,
            timestamp: new Date().toISOString(),
            endpointTests: results
        });
        
    } catch (error) {
        res.status(500).json({
            error: error.message,
            symbol: symbol,
            apiKeyConfigured: !!FMP_API_KEY
        });
    }
}