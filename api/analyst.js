// Vercel serverless function for analyst data from Financial Modeling Prep
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
      let analystData = null;
      
      // Check if FMP API key is available
      const FMP_API_KEY = process.env.FINANCIAL_MODELING_PREP_API_KEY;
      
      if (FMP_API_KEY) {
        try {
          // Fetch multiple analyst data endpoints from FMP
          const [
            recommendationsResponse,
            priceTargetResponse,
            upgradesDowngradesResponse,
            estimatesResponse
          ] = await Promise.all([
            // Analyst recommendations (Buy/Hold/Sell consensus)
            fetch(`https://financialmodelingprep.com/api/v3/analyst-stock-recommendations/${symbol}?apikey=${FMP_API_KEY}`),
            // Price targets
            fetch(`https://financialmodelingprep.com/api/v3/price-target?symbol=${symbol}&apikey=${FMP_API_KEY}`),
            // Recent upgrades/downgrades
            fetch(`https://financialmodelingprep.com/api/v3/upgrades-downgrades?symbol=${symbol}&apikey=${FMP_API_KEY}`),
            // Analyst estimates
            fetch(`https://financialmodelingprep.com/api/v3/analyst-estimates/${symbol}?apikey=${FMP_API_KEY}`)
          ]);
          
          const [recommendations, priceTargets, upgradesDowngrades, estimates] = await Promise.all([
            recommendationsResponse.json(),
            priceTargetResponse.json(),
            upgradesDowngradesResponse.json(),
            estimatesResponse.json()
          ]);
          
          // Process recommendations data
          let consensus = 'Hold';
          let consensusScore = 0;
          let analystCount = 0;
          
          if (recommendations && recommendations.length > 0) {
            const latest = recommendations[0];
            const buyCount = latest.analystRatingsbuy || 0;
            const holdCount = latest.analystRatingsHold || 0;
            const sellCount = latest.analystRatingsSell || 0;
            
            analystCount = buyCount + holdCount + sellCount;
            consensusScore = (buyCount * 1 + holdCount * 0 + sellCount * -1) / analystCount;
            
            if (consensusScore > 0.3) consensus = 'Buy';
            else if (consensusScore < -0.3) consensus = 'Sell';
            else consensus = 'Hold';
          }
          
          // Process price target data
          let avgPriceTarget = null;
          let highTarget = null;
          let lowTarget = null;
          let upside = null;
          let currentPrice = parseFloat(req.query.currentPrice) || 81.07;
          
          if (priceTargets && priceTargets.length > 0) {
            // Calculate average from recent price targets
            const recentTargets = priceTargets.slice(0, 10); // Last 10 targets
            const targets = recentTargets
              .map(pt => parseFloat(pt.priceTarget))
              .filter(pt => pt && !isNaN(pt));
            
            if (targets.length > 0) {
              avgPriceTarget = targets.reduce((sum, target) => sum + target, 0) / targets.length;
              highTarget = Math.max(...targets);
              lowTarget = Math.min(...targets);
              upside = ((avgPriceTarget - currentPrice) / currentPrice) * 100;
            }
          }
          
          // Process recent upgrades/downgrades
          let recentActivity = [];
          if (upgradesDowngrades && upgradesDowngrades.length > 0) {
            recentActivity = upgradesDowngrades
              .slice(0, 5) // Last 5 actions
              .map(ud => ({
                date: ud.publishedDate,
                company: ud.gradingCompany,
                action: ud.newGrade,
                previousGrade: ud.previousGrade,
                priceTarget: ud.priceTarget
              }));
          }
          
          // Calculate earnings estimates
          let nextEarnings = null;
          if (estimates && estimates.length > 0) {
            const nextQuarter = estimates[0];
            nextEarnings = {
              date: nextQuarter.date,
              estimatedEPS: nextQuarter.estimatedEpsAvg,
              estimatedRevenue: nextQuarter.estimatedRevenueAvg,
              analystCount: nextQuarter.numberAnalystEstimatedEps
            };
          }
          
          analystData = {
            symbol: symbol.toUpperCase(),
            consensus: {
              rating: consensus,
              score: consensusScore,
              analystCount: analystCount,
              distribution: recommendations && recommendations.length > 0 ? {
                buy: recommendations[0].analystRatingsbuy || 0,
                hold: recommendations[0].analystRatingsHold || 0,
                sell: recommendations[0].analystRatingsSell || 0
              } : null
            },
            priceTarget: {
              average: avgPriceTarget ? parseFloat(avgPriceTarget.toFixed(2)) : null,
              high: highTarget ? parseFloat(highTarget.toFixed(2)) : null,
              low: lowTarget ? parseFloat(lowTarget.toFixed(2)) : null,
              upside: upside ? parseFloat(upside.toFixed(1)) : null,
              targetCount: priceTargets ? Math.min(priceTargets.length, 10) : 0
            },
            recentActivity: recentActivity,
            nextEarnings: nextEarnings,
            source: 'Financial Modeling Prep',
            lastUpdated: new Date().toISOString()
          };
          
          console.log(`FMP analyst data loaded for ${symbol}`);
          
        } catch (error) {
          console.log('FMP analyst API failed:', error.message);
        }
      }
      
      // Fallback to demo data if FMP fails or no API key
      if (!analystData) {
        analystData = {
          symbol: symbol.toUpperCase(),
          consensus: {
            rating: 'Hold',
            score: 0.2,
            analystCount: 8,
            distribution: {
              buy: 4,
              hold: 3,
              sell: 1
            }
          },
          priceTarget: {
            average: 95.50,
            high: 110.00,
            low: 85.00,
            upside: 18.2,
            targetCount: 6
          },
          recentActivity: [
            {
              date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              company: 'Morgan Stanley',
              action: 'Overweight',
              previousGrade: 'Equal-Weight',
              priceTarget: 98.00
            },
            {
              date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              company: 'Bank of America',
              action: 'Buy',
              previousGrade: 'Buy',
              priceTarget: 105.00
            }
          ],
          nextEarnings: {
            date: '2025-02-15',
            estimatedEPS: 0.89,
            estimatedRevenue: 1520000000,
            analystCount: 12
          },
          source: 'Demo Data',
          lastUpdated: new Date().toISOString()
        };
        
        console.log('Using demo analyst data - FMP API not available');
      }
      
      const response = {
        ...analystData,
        apiKeysUsed: {
          financialModelingPrep: !!process.env.FINANCIAL_MODELING_PREP_API_KEY
        }
      };
      
      res.status(200).json(response);
      
    } catch (error) {
      console.error('Analyst API error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch analyst data',
        message: error.message 
      });
    }
  }