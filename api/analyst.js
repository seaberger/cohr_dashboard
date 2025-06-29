// Vercel Edge Runtime function for analyst data
export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
    // Parse URL to get query parameters
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || process.env.DEFAULT_SYMBOL || 'COHR';
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }
  
    if (request.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    try {
      let analystData = null;
      
      // Primary: Try Yahoo Finance Analysis page scraping with LLM parsing
      let yahooAnalysisData = null;
      try {
        console.log(`Attempting Yahoo Finance analysis page scraping for ${symbol}...`);
        
        const yahooUrl = `https://finance.yahoo.com/quote/${symbol}/analysis`;
        const headers = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        };
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
        
        const response = await fetch(yahooUrl, {
          headers,
          signal: controller.signal,
          redirect: 'follow'
        });
        
        clearTimeout(timeoutId);
        
        console.log(`Yahoo Finance analysis page response status: ${response.status}`);
        
        if (response.ok) {
          const html = await response.text();
          console.log(`Yahoo Finance HTML length: ${html.length}`);
          
          // Extract relevant sections of HTML for LLM processing
          // Look for tables and sections that contain analyst data
          const relevantContent = [];
          
          // Extract tables that likely contain analyst data
          const tableMatches = html.matchAll(/<table[^>]*>.*?<\/table>/gs);
          for (const match of tableMatches) {
            const table = match[0];
            if (table.includes('Estimate') || 
                table.includes('Target') || 
                table.includes('EPS') ||
                table.includes('Revenue') ||
                table.includes('Analyst')) {
              relevantContent.push(table);
            }
          }
          
          // Also extract divs that might contain structured data
          const divMatches = html.matchAll(/<div[^>]*data-test[^>]*>.*?<\/div>/gs);
          for (const match of divMatches) {
            const div = match[0];
            if (div.includes('Estimate') || div.includes('Target') || div.includes('Recommendation')) {
              relevantContent.push(div);
            }
          }
          
          // If we have limited content, take a broader approach
          if (relevantContent.length === 0) {
            // Look for any content that mentions analyst-related terms
            const searchTerms = ['Price Target', 'Earnings Estimate', 'Revenue Estimate', 'Analyst Recommendation', 'EPS'];
            for (const term of searchTerms) {
              const termIndex = html.indexOf(term);
              if (termIndex !== -1) {
                // Extract 2000 characters around the term
                const start = Math.max(0, termIndex - 1000);
                const end = Math.min(html.length, termIndex + 1000);
                relevantContent.push(html.substring(start, end));
              }
            }
          }
          
          if (relevantContent.length > 0) {
            // Use Gemini to extract structured data from HTML
            try {
              const geminiApiKey = process.env.GEMINI_API_KEY;
              if (!geminiApiKey) {
                throw new Error('GEMINI_API_KEY not configured');
              }
              
              const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
              
              const prompt = `You are extracting financial analyst data from Yahoo Finance HTML content. Parse the HTML and extract the analyst estimates, price targets, and recommendation data. Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "priceTargets": {
    "current": <current stock price if shown>,
    "average": <average analyst target>,
    "low": <lowest target>,
    "high": <highest target>,
    "numberOfAnalysts": <number>
  },
  "earningsEstimates": {
    "currentQuarter": {
      "period": <quarter name like "Dec 2024">,
      "average": <average estimate>,
      "low": <low estimate>,
      "high": <high estimate>,
      "numberOfAnalysts": <number>
    },
    "nextQuarter": {
      "period": <quarter name>,
      "average": <average estimate>,
      "low": <low estimate>,
      "high": <high estimate>,
      "numberOfAnalysts": <number>
    },
    "currentYear": {
      "period": <year>,
      "average": <average estimate>,
      "numberOfAnalysts": <number>
    },
    "nextYear": {
      "period": <year>,
      "average": <average estimate>,
      "numberOfAnalysts": <number>
    }
  },
  "revenueEstimates": {
    "currentQuarter": {
      "average": <average in millions>,
      "numberOfAnalysts": <number>,
      "yearAgoSales": <number>,
      "growthPercent": <growth %>
    },
    "nextQuarter": {
      "average": <average in millions>,
      "numberOfAnalysts": <number>,
      "growthPercent": <growth %>
    }
  },
  "recommendationTrend": {
    "current": {
      "strongBuy": <count>,
      "buy": <count>,
      "hold": <count>,
      "sell": <count>,
      "strongSell": <count>
    },
    "history": [
      {
        "period": <month name>,
        "strongBuy": <count>,
        "buy": <count>,
        "hold": <count>,
        "sell": <count>,
        "strongSell": <count>
      }
    ]
  },
  "earningsHistory": [
    {
      "quarter": <quarter ending date>,
      "epsEstimate": <estimate>,
      "epsActual": <actual>,
      "difference": <difference>,
      "surprisePercent": <surprise %>
    }
  ]
}

HTML content to analyze:
${relevantContent.join('\n\n')}`;

              const geminiResponse = await fetch(`${geminiUrl}?key=${geminiApiKey}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  contents: [{
                    parts: [{
                      text: prompt
                    }]
                  }],
                  generationConfig: {
                    temperature: 0.0,
                    topK: 1,
                    topP: 0.1,
                    maxOutputTokens: 4096,
                  }
                })
              });
              
              if (geminiResponse.ok) {
                const geminiData = await geminiResponse.json();
                const responseText = geminiData.candidates[0].content.parts[0].text;
                
                // Extract JSON from response (remove any markdown formatting)
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  const parsedData = JSON.parse(jsonMatch[0]);
                  
                  // Convert to our expected format
                  yahooAnalysisData = {
                    priceTarget: parsedData.priceTargets?.average || null,
                    lowTarget: parsedData.priceTargets?.low || null,
                    highTarget: parsedData.priceTargets?.high || null,
                    currentQtrEps: parsedData.earningsEstimates?.currentQuarter?.average || null,
                    nextQtrEps: parsedData.earningsEstimates?.nextQuarter?.average || null,
                    analystCount: parsedData.priceTargets?.numberOfAnalysts || null,
                    // Store full data for enhanced visualizations
                    fullData: parsedData
                  };
                  
                  console.log('✅ Yahoo Finance analysis data extracted via Gemini:', yahooAnalysisData);
                } else {
                  console.log('❌ Failed to parse Gemini response as JSON');
                }
              } else {
                console.log('❌ Gemini API request failed:', geminiResponse.status);
              }
            } catch (llmError) {
              console.log('❌ LLM extraction failed:', llmError.message);
              // Fall back to regex parsing as backup
              // ... original regex code could go here as fallback ...
            }
          } else {
            console.log('❌ No analyst content found in HTML');
          }
        }
      } catch (error) {
        console.log('❌ Yahoo Finance analysis scraping failed:', error.message);
      }
      
      // No more Finviz scraping - Yahoo Finance LLM parsing only
      console.log('📊 Yahoo Finance data extracted:', yahooAnalysisData);
      
      // Secondary: Try Finnhub API for analyst consensus ratings
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
                
                // Determine consensus rating with more realistic thresholds
                // For "Strong Buy": majority (>50%) must be Strong Buy recommendations
                const strongBuyRatio = strongBuy / analystCount;
                const positiveRatio = (strongBuy + buy) / analystCount;
                
                if (strongBuyRatio > 0.5) finnhubConsensus = 'Strong Buy';
                else if (positiveRatio > 0.7) finnhubConsensus = 'Buy';
                else if (positiveRatio > 0.4) finnhubConsensus = 'Hold';
                else if (consensusScore < -0.3) finnhubConsensus = 'Sell';
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
                
                // Determine consensus rating with more realistic thresholds
                const strongBuyRatio = strongBuy / analystCount;
                const positiveRatio = (strongBuy + buy) / analystCount;
                
                if (strongBuyRatio > 0.5) consensus = 'Strong Buy';
                else if (positiveRatio > 0.7) consensus = 'Buy';
                else if (positiveRatio > 0.4) consensus = 'Hold';
                else if (consensusScore < -0.3) consensus = 'Sell';
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
            const currentPrice = parseFloat(searchParams.get('currentPrice')) || 81.07;
            
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
            
            // Use Yahoo Finance LLM data as primary source, with API data as fallback
            console.log('🔀 Data merging check:', {
              'Yahoo LLM price target': yahooAnalysisData?.priceTarget,
              'Yahoo API avg price target': avgPriceTarget,
              'Analyst count': analystCount,
              'Yahoo LLM enhanced data': !!yahooAnalysisData?.fullData
            });
            
            if (yahooAnalysisData?.priceTarget || avgPriceTarget !== null || analystCount > 0) {
              // Prioritize Yahoo LLM data, fallback to API data
              const targetPrice = yahooAnalysisData?.priceTarget || avgPriceTarget;
              const finalHighTarget = yahooAnalysisData?.highTarget || highTarget;
              const finalLowTarget = yahooAnalysisData?.lowTarget || lowTarget;
              const nextQtrEps = yahooAnalysisData?.nextQtrEps;
              const calculatedUpside = targetPrice ? ((targetPrice - currentPrice) / currentPrice) * 100 : null;
              
              console.log('🎯 Final merged values:', {
                targetPrice,
                finalHighTarget,
                finalLowTarget,
                nextQtrEps,
                calculatedUpside,
                'Enhanced data available': !!yahooAnalysisData?.fullData
              });
              
              if (analystData && analystData.consensusOnly) {
                // We have Finnhub consensus data, but prioritize Yahoo distribution if available
                // Recalculate consensus based on actual distribution data being used
                if (analystCount > 0 && distribution) {
                  // Use Yahoo Finance distribution and recalculate consensus to ensure consistency
                  analystData.consensus = {
                    rating: consensus,
                    score: consensusScore,
                    analystCount: analystCount,
                    distribution: distribution
                  };
                  console.log(`Updated consensus from Yahoo distribution: ${consensus} (${analystCount} analysts)`);
                }
                
                analystData.priceTarget = {
                  average: targetPrice ? parseFloat(targetPrice.toFixed(2)) : null,
                  high: finalHighTarget ? parseFloat(finalHighTarget.toFixed(2)) : null,
                  low: finalLowTarget ? parseFloat(finalLowTarget.toFixed(2)) : null,
                  upside: calculatedUpside ? parseFloat(calculatedUpside.toFixed(1)) : null,
                  targetCount: yahooAnalysisData?.analystCount || analystData.consensus.analystCount
                };
                analystData.recentActivity = recentActivity;
                analystData.nextEarnings = nextQtrEps ? {
                  estimatedEPS: nextQtrEps,
                  source: 'Yahoo Finance LLM'
                } : null;
                // Include enhanced data if available from Yahoo scraping
                if (yahooAnalysisData?.fullData) {
                  analystData.enhancedData = yahooAnalysisData.fullData;
                }
                analystData.source = yahooAnalysisData?.priceTarget ? 'Finnhub + Yahoo Finance LLM' : 'Finnhub + Yahoo Finance API';
                delete analystData.consensusOnly;
                
                console.log(`Combined Finnhub consensus (${analystData.consensus.analystCount} analysts) + ${yahooAnalysisData?.priceTarget ? 'Yahoo LLM' : 'Yahoo API'} price targets ($${targetPrice})`);
              } else if (!analystData) {
                // No Finnhub data, create new data using Yahoo Finance LLM
                analystData = {
                  symbol: symbol.toUpperCase(),
                  consensus: {
                    rating: consensus,
                    score: consensusScore,
                    analystCount: analystCount,
                    distribution: distribution
                  },
                  priceTarget: {
                    average: targetPrice ? parseFloat(targetPrice.toFixed(2)) : null,
                    high: finalHighTarget ? parseFloat(finalHighTarget.toFixed(2)) : null,
                    low: finalLowTarget ? parseFloat(finalLowTarget.toFixed(2)) : null,
                    upside: calculatedUpside ? parseFloat(calculatedUpside.toFixed(1)) : null,
                    targetCount: yahooAnalysisData?.analystCount || analystCount
                  },
                  recentActivity: recentActivity,
                  nextEarnings: nextQtrEps ? {
                    estimatedEPS: nextQtrEps,
                    source: 'Yahoo Finance LLM'
                  } : null,
                  source: yahooAnalysisData?.priceTarget ? 'Yahoo Finance LLM' : 'Yahoo Finance API',
                  lastUpdated: new Date().toISOString(),
                  enhancedData: yahooAnalysisData?.fullData || null
                };
                
                console.log(`${yahooAnalysisData?.priceTarget ? 'Yahoo LLM' : 'Yahoo API'} analyst data loaded for ${symbol} - ${analystCount} analysts, $${targetPrice} target`);
              }
            } else if (yahooAnalysisData?.priceTarget && !analystData) {
              // Only Yahoo LLM price target available, no consensus data
              const currentPrice = parseFloat(searchParams.get('currentPrice')) || 81.07;
              const targetPrice = yahooAnalysisData?.priceTarget;
              const calculatedUpside = ((targetPrice - currentPrice) / currentPrice) * 100;
              
              analystData = {
                symbol: symbol.toUpperCase(),
                consensus: {
                  rating: 'Hold', // Default when no consensus available
                  score: 0,
                  analystCount: 0,
                  distribution: null
                },
                priceTarget: {
                  average: parseFloat(targetPrice.toFixed(2)),
                  high: yahooAnalysisData?.highTarget ? parseFloat(yahooAnalysisData.highTarget.toFixed(2)) : null,
                  low: yahooAnalysisData?.lowTarget ? parseFloat(yahooAnalysisData.lowTarget.toFixed(2)) : null,
                  upside: parseFloat(calculatedUpside.toFixed(1)),
                  targetCount: yahooAnalysisData?.analystCount || 1 // Assuming at least one analyst for the target
                },
                recentActivity: [],
                nextEarnings: yahooAnalysisData?.nextQtrEps ? {
                  estimatedEPS: yahooAnalysisData?.nextQtrEps,
                  source: 'Yahoo Finance LLM'
                } : null,
                source: 'Yahoo Finance LLM',
                lastUpdated: new Date().toISOString(),
                enhancedData: yahooAnalysisData?.fullData || null
              };
              
              console.log(`Yahoo LLM-only analyst data loaded for ${symbol} - $${targetPrice} target`);
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
          let currentPrice = parseFloat(searchParams.get('currentPrice')) || 81.07;
          
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
              const currentPrice = parseFloat(searchParams.get('currentPrice')) || 81.07;
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
      
      // Maintain strict data integrity - no hardcoded price target fallbacks
      // Price targets will show "N/A" if APIs fail, maintaining transparency
      
      // No hardcoded fallback data - maintain data integrity
      if (!analystData) {
        console.log(`No analyst data available for ${symbol} from any source`);
        return new Response(JSON.stringify({
          error: 'Failed to retrieve analyst data',
          message: 'No analyst data available from Finnhub, Yahoo Finance, or FMP APIs',
          symbol,
          details: 'Analyst data sources are currently unavailable. Please try refreshing or check back later.',
          apiKeysUsed: {
            finnhub: !!process.env.FINNHUB_API_KEY,
            financialModelingPrep: !!process.env.FINANCIAL_MODELING_PREP_API_KEY
          }
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
      
      const responseData = {
        ...analystData,
        apiKeysUsed: {
          finnhub: !!process.env.FINNHUB_API_KEY,
          financialModelingPrep: !!process.env.FINANCIAL_MODELING_PREP_API_KEY
        }
      };
      
      // Return successful response with caching headers
      return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 's-maxage=1800, stale-while-revalidate=300',
        },
      });
      
    } catch (error) {
      console.error('Analyst API error:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch analyst data',
        message: error.message 
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  }