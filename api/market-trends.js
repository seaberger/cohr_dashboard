// Market Intelligence API for optical networking and photonics industry
// Enhanced with LLM analysis of SEC filings for dynamic updates
import fetch from 'node-fetch';

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
  
    const { symbol = 'COHR', useLLM = 'true' } = req.query;
  
    try {
      // Try to get LLM-analyzed data first (if enabled)
      if (useLLM === 'true') {
        try {
          console.log('Attempting to fetch LLM-analyzed segment data...');
          const llmResponse = await fetch(`${getBaseUrl(req)}/api/company-insights?symbol=${symbol}`);
          
          if (llmResponse.ok) {
            const llmData = await llmResponse.json();
            console.log('Successfully retrieved LLM analysis');
            return res.status(200).json({
              ...llmData,
              dataSource: 'LLM Analysis',
              analysisMethod: 'Google Gemini 2.5 Flash'
            });
          } else {
            console.log('LLM analysis failed, falling back to static data');
          }
        } catch (error) {
          console.log('LLM analysis error:', error.message);
          console.log('Falling back to static Q2 2025 data');
        }
      }
      // COHR-Specific Market Data (Based on Q2 2025 Earnings)
      const marketData = {
        // AI Datacenter/Datacom - COHR's fastest growing segment
        aiDatacomGrowth: {
          cohrDatacomGrowthYoY: "+79%", // Actual COHR Q2 2025 performance
          cohrDatacomGrowthQoQ: "+4%", // Sequential growth
          keyDriver: "AI datacenter demand, 800G transceiver adoption",
          status: "All-time high revenue"
        },
        
        // Telecom Segment - COHR's second major segment
        telecomGrowth: {
          cohrTelecomGrowthYoY: "+11%", // Actual COHR Q2 2025 performance
          cohrTelecomGrowthQoQ: "+16%", // Sequential growth
          keyDriver: "Data center interconnect, 100G/400G/800G ZR transceivers",
          status: "Strong sequential improvement"
        },
        
        // Industrial/Laser Market - COHR's traditional business
        industrialLaserMarket: {
          cohrLaserGrowthYoY: "+6%", // Actual COHR Q2 2025 performance
          cohrLaserGrowthQoQ: "+8%", // Sequential growth
          keyDriver: "Industrial applications, precision manufacturing",
          status: "Steady growth"
        },
        
        // Materials Segment - COHR's semiconductor materials business
        materialsGrowth: {
          cohrMaterialsGrowthYoY: "-4%", // Actual COHR Q2 2025 performance
          cohrMaterialsGrowthQoQ: "+3%", // Sequential growth
          keyDriver: "Automotive weakness offset by other applications",
          status: "Mixed performance"
        },
        
        // Networking Segment - COHR's combined networking business
        networkingGrowth: {
          cohrNetworkingGrowthYoY: "+56%", // Actual COHR Q2 2025 performance
          cohrNetworkingGrowthQoQ: "+7%", // Sequential growth
          keyDriver: "AI datacenter demand, 800G transceiver ramp",
          status: "Record performance"
        },
        
        // Overall COHR Performance
        cohrOverallPerformance: {
          totalRevenueQ2: "$1.43B", // Actual Q2 2025 revenue
          revenueGrowthYoY: "+27%", // Year over year growth
          revenueGrowthQoQ: "+6%", // Sequential growth
          grossMargin: "35.5%", // GAAP gross margin
          keyHighlight: "Record revenue driven by AI demand"
        },
        
        // Technology Trends
        technologyTrends: {
          coherentOptics: "Growing adoption for long-haul",
          siliconPhotonics: "Cost reduction and integration",
          co_packagedOptics: "Next-gen datacenter architecture",
          quantumNetworking: "Emerging research area"
        },
        
        // Market Intelligence Metadata
        dataQuality: "High", // Based on actual COHR earnings reports
        lastUpdated: new Date().toISOString(),
        sources: [
          "Coherent Corp Q2 2025 Earnings Report (Fallback Data)",
          "COHR SEC 10-Q Filing Q2 2025", 
          "Coherent Corp Investor Relations",
          "Yahoo Finance Earnings Call Transcript",
          "The Futurum Group Analysis"
        ],
        confidence: "95%", // High confidence - actual company data
        updateFrequency: "Quarterly", // Updated when COHR reports earnings
        dataType: "Company-Specific Performance (Static Fallback)" // Based on actual COHR results
      };

      // Calculate some dynamic insights
      const insights = generateMarketInsights();
      
      const response = {
        status: "success",
        marketIntelligence: marketData,
        insights: insights,
        cohrRelevance: {
          primaryMarkets: ["Datacom transceivers", "Telecom infrastructure", "Industrial lasers"],
          marketPosition: "Top 5 global optical components supplier",
          competitiveAdvantages: ["Vertical integration", "R&D leadership", "Broad portfolio"],
          growthCatalysts: ["AI datacenter buildout", "5G infrastructure", "800G adoption"]
        },
        dataSource: "Static Fallback Data",
        warning: "Using Q2 2025 fallback data - LLM analysis unavailable",
        generatedAt: new Date().toISOString()
      };

      res.status(200).json(response);

    } catch (error) {
      console.error('Market trends API error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch market intelligence',
        message: error.message,
        fallback: 'Using cached market data'
      });
    }
}

function getBaseUrl(req) {
  // Handle both local development and production
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${protocol}://${host}`;
}

function generateMarketInsights() {
  return {
    marketGrowth: `The optical transceiver market is experiencing robust growth, driven primarily by AI datacenter expansion and 5G infrastructure deployment.`,
    
    keyOpportunity: `Network infrastructure demand remains strong with 5G expansion and AI datacenter buildout creating sustained growth opportunities.`,
    
    technologyShift: `The industry is transitioning through speed generations (100G→400G→800G→1.6T), creating upgrade cycles for optical component suppliers.`,
    
    regionalOutlook: `North America leads in market share, while Asia-Pacific shows the fastest growth potential driven by datacenter expansion.`,
    
    endMarketAnalysis: `Datacom represents the largest segment of demand, reflecting the AI/cloud computing boom driving optical networking needs.`
  };
}