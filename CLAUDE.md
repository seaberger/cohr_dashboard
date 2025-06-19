# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**COHR Investor Dashboard** - A comprehensive, real-time financial dashboard for Coherent Corp (NASDAQ: COHR) featuring live stock data, real technical analysis, business segment performance, and financial news intelligence.

**Status**: ✅ **DEPLOYED AND LIVE** on Vercel  
**Live URL**: Available in Vercel dashboard  
**Last Updated**: January 2025  
**Development Stage**: Sprint 3 Complete (Technical Analysis ✅, Market Intelligence ✅)

## Commands

### Development
- `npm run dev` or `vercel dev` - Start local development server with serverless functions
- `npm run start` - Alias for dev server
- **Local Setup**: Create `.env` file with API keys (see `.env` example in repo)

### Deployment
- **Auto-deployment**: Push to GitHub main branch triggers Vercel deployment
- **Manual**: Vercel dashboard → Deployments → Redeploy
- **Environment Variables**: Must be configured in Vercel dashboard before deployment

### Testing
- No testing framework currently configured
- Manual testing via live dashboard and API endpoint testing

## Architecture Overview

### Current Tech Stack
- **Frontend**: Static HTML5 + Vanilla JavaScript with professional financial styling
- **Backend**: Vercel Serverless Functions (Node.js)
- **Deployment**: Vercel with GitHub integration
- **Charts**: TradingView widget integration
- **APIs**: Multiple financial data sources with fallback strategy

### Project Structure
```
/
├── index.html                    # Main dashboard with enhanced features
├── api/                          # Vercel serverless functions
│   ├── stock.js                 # Yahoo Finance real-time quotes (chart API)
│   ├── news.js                  # Yahoo Finance news with article summaries
│   ├── analyst.js               # Yahoo Finance analyst consensus data
│   ├── technical.js             # Basic technical indicators (fallback)
│   ├── technical-real.js        # Real historical technical analysis
│   ├── technical-enhanced.js    # Advanced technical analysis (ES6 issues)
│   ├── historical.js            # Yahoo Finance historical OHLCV data
│   └── market-trends.js         # COHR business segment performance
├── lib/                          # Technical analysis libraries
│   └── technicalAnalysis.js     # Support/resistance calculation functions
├── testing/                      # Test scripts and utilities
├── backups/                      # Original design files
├── docs/                         # Project documentation
├── DEVELOPMENT_ROADMAP.md        # 4-sprint development plan
├── package.json                  # Dependencies (node-fetch, cors)
├── vercel.json                   # Deployment configuration
└── .env                          # API keys (local only, gitignored)
```

### API Endpoints
All endpoints support CORS and have 30-second timeout limits:
- `GET /api/stock?symbol=COHR` - Stock price, market cap, change data
- `GET /api/news?symbol=COHR&limit=10` - COHR-specific financial news with summaries
- `GET /api/analyst?symbol=COHR&currentPrice={price}` - Analyst consensus and price targets
- `GET /api/technical?symbol=COHR&price={price}` - Basic technical indicators (fallback)
- `GET /api/technical-real?symbol=COHR&period=1y` - Real historical technical analysis
- `GET /api/historical?symbol=COHR&period=1y` - Historical OHLCV data
- `GET /api/market-trends` - COHR business segment performance (Q2 2025 earnings)

### Data Flow Architecture
1. **Stock Data**: Yahoo Finance chart API → Finnhub → Alpha Vantage → fallback APIs → demo data
2. **News Data**: Yahoo Finance search API → article summary extraction
3. **Analyst Data**: Yahoo Finance quoteSummary → fallback to research data
4. **Technical Analysis**: Yahoo Finance historical data → real support/resistance calculation
5. **Market Intelligence**: COHR Q2 2025 earnings data → business segment performance
6. **Frontend**: 5-minute auto-refresh, enhanced technical analysis, data transparency

## Environment Variables

### Required (Production)
```
ALPHA_VANTAGE_API_KEY=your_key_here     # Primary stock data source
NEWS_API_KEY=your_key_here              # Financial news articles
```

### Optional (Configuration)
```
FINANCIAL_MODELING_PREP_API_KEY=your_key_here  # FMP API for news and analyst data
DEFAULT_SYMBOL=COHR                            # Default stock symbol
MAX_NEWS_ARTICLES=10                           # Max news articles to return
REFRESH_INTERVAL_MS=300000                     # Frontend refresh interval
```

### API Fallback Strategy
- **Stock Data**: Yahoo Finance chart API → Finnhub → Alpha Vantage → IEX → Demo data
- **News Data**: Yahoo Finance search → article summary extraction → curated fallback
- **Analyst Data**: Yahoo Finance quoteSummary → research-compiled consensus data
- **Technical Analysis**: Yahoo Finance historical → basic calculated indicators → demo data
- **Market Intelligence**: COHR earnings data → cached Q2 2025 performance
- **Error Handling**: Graceful degradation, comprehensive fallback strategies

## Current Data Sources Status

### ✅ LIVE & REAL DATA
- **Stock price, change, market cap** (Yahoo Finance chart API - real-time)
- **TradingView interactive charts** with technical overlays
- **Real technical analysis** (Yahoo Finance historical data)
  - Support/resistance from actual swing highs/lows
  - Moving averages (20, 50, 200-day) as dynamic levels
  - RSI, MACD calculated from historical price data
- **COHR-specific news articles** (Yahoo Finance search API)
- **Article summaries** (extracted from meta descriptions)
- **Analyst consensus data** (Yahoo Finance quoteSummary)
- **COHR business segment performance** (Q2 2025 earnings data)
  - AI Datacom: +79% YoY growth
  - Networking: +56% YoY growth
  - Telecom: +11% YoY growth
  - Industrial Lasers: +6% YoY growth

### ⚠️ QUARTERLY UPDATED DATA
- **Market Intelligence**: COHR Q2 2025 earnings performance
- **Analyst ratings**: Buy consensus from multiple analysts
- **Price targets**: Research-compiled from major firms

### ❌ HIDDEN/PLANNED DATA
- **Competitive positioning** (hidden until Sprint 2)
- **AI-powered insights** (planned for Sprint 4)

## Development Progress & Roadmap

### ✅ COMPLETED SPRINTS
**Sprint 1: Real Technical Analysis** ✅
- Implemented Yahoo Finance historical data integration
- Real support/resistance from swing highs/lows
- Enhanced technical indicators (RSI, MACD, Volume)
- Moving averages as dynamic support/resistance levels

**Sprint 3: Market Intelligence** ✅  
- COHR business segment performance data
- Q2 2025 earnings-based market intelligence
- Data transparency features with source verification
- Quarterly update cycle aligned with earnings

### 🚧 NEXT PRIORITIES (Sprint 2: Competitive Intelligence)
1. **Competitive positioning section** (currently hidden)
2. **Peer company performance comparison**
3. **Relative stock performance vs competitors**
4. **Industry positioning and market share data**

### 🔮 FUTURE ENHANCEMENTS (Sprint 4: AI Integration)
- OpenAI-powered news sentiment analysis
- AI-generated investment insights
- Interactive Q&A about COHR performance
- Automated earnings analysis and alerts

### 🎯 MEDIUM PRIORITY ENHANCEMENTS
- **Dynamic Ticker Selection** (Feature Request)
  - Interactive search with auto-complete for any stock ticker/company name
  - Dynamic market intelligence tiles based on selected company
  - SEC filing analysis via LLM to generate relevant dashboard tiles
  - ~10 days development effort across 3 phases
  - See `/issues/dynamic-ticker-selection.md` for full details

### 🔧 TECHNICAL IMPROVEMENTS
- Server-side caching for API responses
- Enhanced error handling UI
- Loading state improvements
- Performance optimization

## Development Workflow

### Making Changes
1. **Local development**: Use `vercel dev` to test serverless functions
2. **API changes**: Modify files in `/api/` directory
3. **Frontend changes**: Edit `index.html` directly
4. **Testing**: Manual testing via browser and API endpoint testing

### Deployment Process
1. Commit changes to main branch
2. GitHub automatically triggers Vercel deployment
3. Check Vercel dashboard for deployment status
4. Verify live dashboard functionality

### Debugging
- **Vercel Function Logs**: Available in Vercel dashboard
- **Browser Console**: Check for JavaScript errors
- **API Testing**: Test endpoints directly via browser or curl
- **Network Tab**: Monitor API response times and failures

## Security Considerations

### ✅ Current Security Measures
- API keys stored as environment variables (never in code)
- `.env` file excluded from version control
- CORS properly configured for API endpoints
- HTTPS enforced by Vercel platform
- No client-side exposure of sensitive data

### 🔒 Security Best Practices
- Regularly rotate API keys
- Monitor API usage and rate limits
- Keep dependencies updated
- Review function logs for suspicious activity

## Performance Notes

### Current Performance
- **Page Load**: ~2-3 seconds initial load
- **API Response**: ~500ms-2s depending on external APIs
- **Auto-refresh**: Every 5 minutes
- **Caching**: Browser-level caching only

### Optimization Opportunities
- Implement server-side caching for API responses
- Add service worker for offline capability
- Optimize JavaScript bundle size
- Consider lazy loading for non-critical components

## Yahoo Finance API Integration

### Key Endpoints Used
- **Stock Data**: `https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?period1={start}&period2={end}&interval=1m&includePrePost=true`
- **Historical Data**: `https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?period1={start}&period2={end}&interval=1d`
- **Analyst Data**: `https://query1.finance.yahoo.com/v10/finance/quoteSummary/{symbol}?modules=recommendationTrend,financialData,upgradeDowngradeHistory`
- **News Search**: `https://query1.finance.yahoo.com/v1/finance/search?q={symbol}`

### Data Processing Pipeline
1. **Historical Analysis**: 1-2 years of OHLCV data for technical analysis
2. **Support/Resistance**: Swing high/low detection with strength scoring
3. **Moving Averages**: Dynamic support/resistance calculation
4. **News Intelligence**: COHR-specific article filtering and summary extraction
5. **Earnings Integration**: COHR Q2 2025 business segment performance

### API Reliability Measures
- User-Agent headers for consistent access
- Fallback strategies for each endpoint
- Graceful error handling with cached data
- Rate limiting and timeout protection

### Recent Updates (January 2025)
- **Fixed live stock price display**: Switched from quoteSummary to chart API endpoint
- **Chart API advantages**: No authentication required, real-time data during market hours
- **Polygon.io disabled**: Was using /prev endpoint returning yesterday's data