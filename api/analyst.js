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
      
      // Primary: Try Finnhub API for analyst data (60 req/min, excellent analyst coverage)
      const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
      
      if (FINNHUB_API_KEY) {
        try {
          // Fetch analyst recommendations from Finnhub (free tier)
          // Note: Price targets require paid plan, so we'll get those from fallback APIs
          const recommendationResponse = await fetch(`https://finnhub.io/api/v1/stock/recommendation?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
          
          if (recommendationResponse.ok) {
            const recommendations = await recommendationResponse.json();
            
            // Process Finnhub recommendation data (consensus ratings)
            let finnhubConsensus = null;
            let consensusScore = 0;
            let analystCount = 0;
            let distribution = null;
            
            if (recommendations && recommendations.length > 0) {
              // Get the most recent recommendation data
              const latest = recommendations[0];
              const strongBuy = latest.strongBuy || 0;
              const buy = latest.buy || 0;
              const hold = latest.hold || 0;
              const sell = latest.sell || 0;
              const strongSell = latest.strongSell || 0;
              
              analystCount = strongBuy + buy + hold + sell + strongSell;
              
              if (analystCount > 0) {
                // Calculate consensus score (-2 to +2 scale)
                consensusScore = ((strongBuy * 2) + (buy * 1) + (hold * 0) + (sell * -1) + (strongSell * -2)) / analystCount;
                
                // Determine consensus rating
                if (consensusScore > 0.5) finnhubConsensus = 'Strong Buy';
                else if (consensusScore > 0.1) finnhubConsensus = 'Buy';
                else if (consensusScore < -0.5) finnhubConsensus = 'Strong Sell';
                else if (consensusScore < -0.1) finnhubConsensus = 'Sell';
                else finnhubConsensus = 'Hold';
                
                distribution = {
                  strongBuy: strongBuy,
                  buy: buy,
                  hold: hold,
                  sell: sell,
                  strongSell: strongSell
                };
                
                console.log(`Finnhub recommendation data loaded for ${symbol} - ${analystCount} analysts, ${finnhubConsensus} consensus`);
              }
            }
            
            // Store Finnhub consensus data for potential use
            if (finnhubConsensus) {
              analystData = {
                symbol: symbol.toUpperCase(),
                consensus: {
                  rating: finnhubConsensus,
                  score: consensusScore,
                  analystCount: analystCount,
                  distribution: distribution
                },
                priceTarget: {
                  average: null, // Will try to get from other sources
                  high: null,
                  low: null,
                  upside: null,
                  targetCount: 0
                },
                recentActivity: [],
                nextEarnings: null,
                source: 'Finnhub + Yahoo Finance',
                lastUpdated: new Date().toISOString(),
                consensusOnly: true // Flag to indicate we need price targets from other sources
              };
            }
          }
        } catch (error) {
          console.log('Finnhub analyst API failed:', error.message);
        }
      }
      
      // Secondary: Try Yahoo Finance API for analyst data (free and often reliable)
      try {
        const yahooResponse = await fetch(
          `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=recommendationTrend,financialData,defaultKeyStatistics,upgradeDowngradeHistory`,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          }
        );
        
        if (yahooResponse.ok) {
          const yahooData = await yahooResponse.json();
          
          if (yahooData && yahooData.quoteSummary && yahooData.quoteSummary.result && yahooData.quoteSummary.result[0]) {
            const result = yahooData.quoteSummary.result[0];
            
            // Process recommendation trend
            let consensus = 'Hold';
            let consensusScore = 0;
            let analystCount = 0;
            let distribution = null;
            
            if (result.recommendationTrend && result.recommendationTrend.trend && result.recommendationTrend.trend.length > 0) {
              const latest = result.recommendationTrend.trend[0];
              const strongBuy = latest.strongBuy || 0;
              const buy = latest.buy || 0;
              const hold = latest.hold || 0;
              const sell = latest.sell || 0;
              const strongSell = latest.strongSell || 0;
              
              analystCount = strongBuy + buy + hold + sell + strongSell;
              
              if (analystCount > 0) {
                consensusScore = ((strongBuy * 2) + (buy * 1) + (hold * 0) + (sell * -1) + (strongSell * -2)) / analystCount;
                
                if (consensusScore > 0.5) consensus = 'Strong Buy';
                else if (consensusScore > 0.1) consensus = 'Buy';
                else if (consensusScore < -0.5) consensus = 'Strong Sell';
                else if (consensusScore < -0.1) consensus = 'Sell';
                else consensus = 'Hold';
                
                distribution = {
                  strongBuy: strongBuy,
                  buy: buy,
                  hold: hold,
                  sell: sell,
                  strongSell: strongSell
                };
              }
            }
            
            // Process price targets from financial data
            let avgPriceTarget = null;
            let highTarget = null;
            let lowTarget = null;
            let upside = null;
            const currentPrice = parseFloat(req.query.currentPrice) || 81.07;
            
            if (result.financialData) {
              if (result.financialData.targetMeanPrice && result.financialData.targetMeanPrice.raw) {
                avgPriceTarget = result.financialData.targetMeanPrice.raw;
              }
              if (result.financialData.targetHighPrice && result.financialData.targetHighPrice.raw) {
                highTarget = result.financialData.targetHighPrice.raw;
              }
              if (result.financialData.targetLowPrice && result.financialData.targetLowPrice.raw) {
                lowTarget = result.financialData.targetLowPrice.raw;
              }
              
              if (avgPriceTarget) {
                upside = ((avgPriceTarget - currentPrice) / currentPrice) * 100;
              }
            }
            
            // Process recent upgrades/downgrades
            let recentActivity = [];
            if (result.upgradeDowngradeHistory && result.upgradeDowngradeHistory.history) {
              recentActivity = result.upgradeDowngradeHistory.history
                .slice(0, 5)
                .map(item => ({
                  date: new Date(item.epochGradeDate * 1000).toISOString().split('T')[0],
                  company: item.firm,
                  action: item.toGrade || 'Updated',
                  previousGrade: item.fromGrade,
                  priceTarget: null
                }));
            }
            
            // Merge Yahoo Finance price targets with existing Finnhub consensus data or create new data
            if (avgPriceTarget !== null || analystCount > 0) {
              if (analystData && analystData.consensusOnly) {
                // We have Finnhub consensus data, add Yahoo price targets
                analystData.priceTarget = {
                  average: avgPriceTarget ? parseFloat(avgPriceTarget.toFixed(2)) : null,
                  high: highTarget ? parseFloat(highTarget.toFixed(2)) : null,
                  low: lowTarget ? parseFloat(lowTarget.toFixed(2)) : null,
                  upside: upside ? parseFloat(upside.toFixed(1)) : null,
                  targetCount: avgPriceTarget ? Math.max(analystData.consensus.analystCount, analystCount) : analystData.consensus.analystCount
                };
                analystData.recentActivity = recentActivity;
                analystData.source = 'Finnhub + Yahoo Finance';
                delete analystData.consensusOnly;
                
                console.log(`Combined Finnhub consensus (${analystData.consensus.analystCount} analysts) + Yahoo price targets ($${avgPriceTarget})`);
              } else if (!analystData) {
                // No Finnhub data, use Yahoo data as fallback
                analystData = {
                  symbol: symbol.toUpperCase(),
                  consensus: {
                    rating: consensus,
                    score: consensusScore,
                    analystCount: analystCount,
                    distribution: distribution
                  },
                  priceTarget: {
                    average: avgPriceTarget ? parseFloat(avgPriceTarget.toFixed(2)) : null,
                    high: highTarget ? parseFloat(highTarget.toFixed(2)) : null,
                    low: lowTarget ? parseFloat(lowTarget.toFixed(2)) : null,
                    upside: upside ? parseFloat(upside.toFixed(1)) : null,
                    targetCount: analystCount
                  },
                  recentActivity: recentActivity,
                  nextEarnings: null,
                  source: 'Yahoo Finance',
                  lastUpdated: new Date().toISOString()
                };
                
                console.log(`Yahoo Finance analyst data loaded for ${symbol} - ${analystCount} analysts, $${avgPriceTarget} target`);
              }
            } else {
              console.log(`Yahoo Finance returned no useful analyst data for ${symbol}`);
            }
          }
        }
      } catch (error) {
        console.log('Yahoo Finance API failed:', error.message);
      }
      
      // Tertiary: Try FMP API if Finnhub and Yahoo didn't work and FMP key is available
      const FMP_API_KEY = process.env.FINANCIAL_MODELING_PREP_API_KEY;
      
      if (!analystData && FMP_API_KEY) {
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
          
          // Only use FMP data if we have meaningful analyst data
          if (analystCount > 0 || avgPriceTarget !== null) {
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
            
            console.log(`FMP analyst data loaded for ${symbol} - ${analystCount} analysts, $${avgPriceTarget} target`);
          } else {
            console.log(`FMP returned empty analyst data for ${symbol} - falling back to research data`);
          }
          
        } catch (error) {
          console.log('FMP analyst API failed:', error.message);
        }
      }
      
      // Additional fallback: Try to scrape price targets from Yahoo Finance analysis page
      if (analystData && !analystData.priceTarget.average) {
        try {
          console.log(`Attempting to scrape price targets for ${symbol} from Yahoo Finance analysis page`);
          
          const analysisUrl = `https://finance.yahoo.com/quote/${symbol}/analysis`;
          const response = await fetch(analysisUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });
          
          if (response.ok) {
            const html = await response.text();
            
            // Look for price target data in the HTML (this is a simple pattern match)
            const targetMatch = html.match(/Price Target.*?(\$[\d,]+\.?\d*)/i);
            const highMatch = html.match(/High.*?(\$[\d,]+\.?\d*)/i);
            const lowMatch = html.match(/Low.*?(\$[\d,]+\.?\d*)/i);
            
            if (targetMatch) {
              const avgTarget = parseFloat(targetMatch[1].replace(/[$,]/g, ''));
              const highTarget = highMatch ? parseFloat(highMatch[1].replace(/[$,]/g, '')) : null;
              const lowTarget = lowMatch ? parseFloat(lowMatch[1].replace(/[$,]/g, '')) : null;
              const currentPrice = parseFloat(req.query.currentPrice) || 81.07;
              const upside = ((avgTarget - currentPrice) / currentPrice) * 100;
              
              analystData.priceTarget = {
                average: parseFloat(avgTarget.toFixed(2)),
                high: highTarget ? parseFloat(highTarget.toFixed(2)) : null,
                low: lowTarget ? parseFloat(lowTarget.toFixed(2)) : null,
                upside: parseFloat(upside.toFixed(1)),
                targetCount: analystData.consensus.analystCount
              };
              
              analystData.source += ' + Scraped';
              console.log(`Scraped price target for ${symbol}: $${avgTarget}`);
            }
          }
        } catch (error) {
          console.log('Price target scraping failed:', error.message);
        }
      }
      
      // No hardcoded fallback data - maintain data integrity
      if (!analystData) {
        console.log(`No analyst data available for ${symbol} from any source`);
        return res.status(500).json({
          error: 'Failed to retrieve analyst data',
          message: 'No analyst data available from Finnhub, Yahoo Finance, or FMP APIs',
          symbol,
          details: 'Analyst data sources are currently unavailable. Please try refreshing or check back later.',
          apiKeysUsed: {
            finnhub: !!process.env.FINNHUB_API_KEY,
            financialModelingPrep: !!process.env.FINANCIAL_MODELING_PREP_API_KEY
          }
        });
      }
      
      const response = {
        ...analystData,
        apiKeysUsed: {
          finnhub: !!process.env.FINNHUB_API_KEY,
          financialModelingPrep: !!process.env.FINANCIAL_MODELING_PREP_API_KEY
        }
      };
      
      // Add caching headers to reduce API calls (30 minutes)
      res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=300');
      res.status(200).json(response);
      
    } catch (error) {
      console.error('Analyst API error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch analyst data',
        message: error.message 
      });
    }
  }