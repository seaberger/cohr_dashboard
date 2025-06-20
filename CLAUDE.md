# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**COHR Investor Dashboard** - A comprehensive, real-time financial dashboard for Coherent Corp (NASDAQ: COHR) featuring live stock data, real technical analysis, business segment performance, and financial news intelligence.

**Status**: ✅ **DEPLOYED AND LIVE** on Vercel  
**Live URL**: Available in Vercel dashboard  
**Feature Branch URL**: https://cohr-dashboard-git-feature-univer-6a9738-sean-bergmans-projects.vercel.app/  
**Last Updated**: December 2025  
**Development Stage**: Universal Financial Metrics ✅ (Issue #9 Complete)  
**Current Sprint**: Enhanced Dynamic Insights Feed - Structured tagging & professional layout

### 🚧 **Current Feature Branch Status** (`feature/universal-financial-tiles`)
- ✅ **Universal Financial Metrics**: 8 KPI tiles with sparklines working live
  - Real data: $4.28B revenue (+26%), 35.0% gross margin (+5.0pp)
  - Some metrics showing N/A (Operating Margin, FCF, ROIC, EPS Growth)
  - Layout: 4x2 grid with organized rows (Scale+Profitability / Returns+Capital)
- 🚧 **Next Implementation**: Enhanced Dynamic Insights Feed
  - Tagged insight cards with structured grammar
  - Evidence attribution and confidence scoring
  - 8 insight categories: GROWTH-DRIVER, RISK, STRATEGIC-MOVE, etc.

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
│   ├── market-trends.js         # Enhanced with LLM analysis + Q2 2025 fallback
│   ├── sec-filings.js           # SEC EDGAR filing fetcher
│   └── analyze-segments.js      # Google Gemini 2.5 Flash Lite LLM analysis
├── lib/                          # Technical analysis libraries  
│   ├── technicalAnalysis.js     # Support/resistance calculation functions
│   └── geminiService.js         # Google Gemini 2.5 Flash Lite LLM utilities
├── testing/                      # Test scripts and utilities
│   └── test-llm-integration.js  # LLM API testing script
├── backups/                      # Original design files
├── docs/                         # Project documentation
│   └── LLM_INTEGRATION.md       # Comprehensive LLM integration guide
├── DEVELOPMENT_ROADMAP.md        # 4-sprint development plan  
├── package.json                  # Dependencies (node-fetch, @google/generative-ai)
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
- `GET /api/market-trends?useLLM=true` - Dynamic market intelligence (LLM + fallback)
- `GET /api/sec-filings?symbol=COHR&type=10-Q` - Latest SEC filing fetcher
- `GET /api/analyze-segments?symbol=COHR` - LLM analysis of business segments

### Data Flow Architecture
1. **Stock Data**: Yahoo Finance chart API → Finnhub → Alpha Vantage → fallback APIs → demo data
2. **News Data**: Yahoo Finance search API → article summary extraction
3. **Analyst Data**: Yahoo Finance quoteSummary → fallback to research data
4. **Technical Analysis**: Yahoo Finance historical data → real support/resistance calculation
5. **Market Intelligence**: SEC EDGAR API → Google Gemini 2.5 Flash Lite → dynamic analysis → Q2 2025 fallback
6. **LLM Pipeline**: SEC filing text → Gemini analysis → structured JSON → frontend tiles
7. **Frontend**: 5-minute auto-refresh, LLM indicators, manual refresh, data transparency

## Environment Variables

### Required (Production)
```
ALPHA_VANTAGE_API_KEY=your_key_here     # Primary stock data source
NEWS_API_KEY=your_key_here              # Financial news articles
GEMINI_API_KEY=your_key_here            # Google Gemini 2.5 Flash Lite for LLM analysis
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
- **Market Intelligence**: SEC EDGAR + Gemini LLM → Q2 2025 static fallback
- **LLM Analysis**: Latest SEC filing analysis → cached results → static Q2 2025 data
- **Error Handling**: Graceful degradation, comprehensive fallback strategies

## Current Data Sources Status

### ✅ LIVE & REAL DATA
- **Universal Financial Metrics** (8 Key KPIs with sparklines) ✨ NEW
  - **Top Row (Scale + Profitability)**: Revenue, Gross Margin, Operating Margin, FCF
  - **Second Row (Returns + Capital)**: R&D/Revenue, ROIC, Debt/Equity, Cash & ST Investments
  - **Visual enhancements**: Trend arrows (↗↘→), 8-quarter sparklines, responsive grid
  - **Real Q3 2025 data**: $4.28B revenue (+26%), 35.0% gross margin (+5.0pp)
- **Stock price, change, market cap** (Yahoo Finance chart API - real-time)
- **TradingView interactive charts** with technical overlays
- **Real technical analysis** (Yahoo Finance historical data)
  - Support/resistance from actual swing highs/lows
  - Moving averages (20, 50, 200-day) as dynamic levels
  - RSI, MACD calculated from historical price data
- **COHR-specific news articles** (Yahoo Finance search API)
- **Article summaries** (extracted from meta descriptions)
- **Analyst consensus data** (Yahoo Finance quoteSummary)
- **Dynamic business insights** (Google Gemini 2.5 Flash Lite + SEC EDGAR) ✨ ENHANCED
  - **Tagged insight cards**: GROWTH-DRIVER 🚀, RISK ⚠, STRATEGIC-MOVE 🎯, etc.
  - **Evidence attribution**: SEC filing page references with inline footnotes
  - **Confidence scoring**: 0-100% reliability indicators
  - **Structured grammar**: One-sentence headline + context + evidence

### ⚠️ QUARTERLY UPDATED DATA (Fallback Only)
- **Static Q2 2025 data**: Used only when LLM analysis fails
- **Analyst ratings**: Buy consensus from multiple analysts  
- **Price targets**: Research-compiled from major firms

### 🤖 LLM INTEGRATION STATUS
- **Google Gemini 2.5 Flash Lite**: Deployed and analyzing latest SEC filings
- **SEC EDGAR Integration**: Fetching 10-Q/10-K filings automatically
- **Data Extraction**: Q3 2025 real segment performance extracted successfully
- **Cost**: <$1/month with smart caching (24hr filing cache, 7-day analysis cache)
- **Visual Indicators**: Green = LLM analyzed, Orange = Q2 fallback
- **Manual Refresh**: Users can trigger latest filing analysis
- **Error Handling**: Graceful fallback to Q2 2025 static data

### ❌ HIDDEN/PLANNED DATA
- **Competitive positioning** (hidden until Sprint 2)
- **Multi-company support** (dynamic ticker selection planned)

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

**LLM Integration: Dynamic SEC Filing Analysis** ✅ (June 2025)
- Google Gemini 2.5 Flash Lite integration for SEC filing analysis
- Automatic fetching of latest 10-Q/10-K filings from SEC EDGAR
- Real-time extraction of Q3 2025 business segment performance
- Smart fallback to Q2 2025 data with visual indicators
- Manual refresh functionality and enhanced error handling
- Cost-effective implementation (<$1/month with caching)

### 🚧 NEXT PRIORITIES (Segment Tiles Enhancement - Issue #9)
1. **Visual & UX Improvements** 
   - Color-coded growth indicators (green/red for positive/negative growth)
   - Mobile-responsive CSS Grid layout with auto-fit columns
   - Click-for-details modal showing raw segment data
   - Improved typography and visual hierarchy
2. **Data Structure Optimization**
   - Standardized LLM response format for consistent rendering
   - Canonical segment naming (legacy vs new segment structures)
   - Session storage cache to prevent unnecessary refetching
3. **Performance & Reliability**
   - Timeout handling with Promise.race + retry button
   - Edge function caching with s-maxage headers
4. **Key Insights Integration**
   - LLM-generated insights (growth drivers, risks, margin analysis)
   - Insight cards with color-coded impact indicators
   - Confidence scoring and source text attribution

### 🔮 FUTURE PRIORITIES (Sprint 2: Competitive Intelligence)
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

## Segment Tiles Enhancement Plan (Issue #9)

### Current Status
- **Live Q3 2025 data**: Individual segment growth rates from LLM analysis
  - Networking: +45% YoY
  - Materials: -1% YoY  
  - Lasers: +4% YoY
- **Google Gemini 2.5 Flash Lite**: Successfully extracting structured data from SEC filings
- **Schema validation**: Zod-based validation prevents data transformation errors

### Planned Enhancements (5 Phases)

**Phase 1: Visual & UX Improvements** (30 minutes)
- Color-coded growth indicators using HSL background colors
- Mobile-responsive CSS Grid with auto-fit columns
- Click-for-details modal using HTML5 dialog element
- Improved typography and visual hierarchy

**Phase 2: Data Structure Optimization** (45 minutes)
- Standardized LLM response format with canonical segment names
- Session storage cache between page navigations
- Enhanced data extraction with revenue in millions

**Phase 3: Performance & Reliability** (30 minutes)
- Promise.race timeout handling with retry buttons
- Vercel Edge Function caching with s-maxage headers
- Stale data indicators and loading states

**Phase 4: Key Insights Integration** (2 hours)
- LLM-generated insights extraction (growth drivers, risks, margin analysis)
- Color-coded insight cards with impact indicators
- Confidence scoring and source text attribution
- Single JSON payload approach (no additional API calls)

**Phase 5: Visual Enhancements** (1 hour)
- Mini sparklines using Chart.js for trend context
- Revenue magnitude indicators (visual weight based on segment size)
- Quarter-over-quarter directional arrows

### Implementation Approach
- **No new heavy dependencies**: Vanilla JS, CSS Grid, HTML5 dialog
- **Extend existing Gemini integration**: Single enhanced LLM call
- **Backward compatibility**: Maintain current fallback mechanisms
- **Mobile-first design**: Responsive grid layout for all devices

### Expected Benefits
- **Enhanced visual scanning**: Immediately identify growth vs decline segments
- **Richer context**: Understand the "why" behind growth numbers
- **Better mobile experience**: Responsive design for all devices
- **Improved performance**: Smart caching reduces load times and API costs
- **Professional appearance**: Color-coded, well-organized financial dashboard

See GitHub Issue #9 for complete implementation details and progress tracking.