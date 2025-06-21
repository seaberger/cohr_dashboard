# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**COHR Investor Dashboard** - A comprehensive, real-time financial dashboard for Coherent Corp (NASDAQ: COHR) featuring live stock data, real technical analysis, business segment performance, and financial news intelligence.

**Status**: ✅ **DEPLOYED AND LIVE** on Vercel  
**Live URL**: Available in Vercel dashboard  
**Feature Branch URL**: https://cohr-dashboard-git-feature-univer-6a9738-sean-bergmans-projects.vercel.app/  
**Last Updated**: December 2025  
**Development Stage**: Financial Metrics ✅ **COMPLETE & WORKING**  
**Current Sprint**: Company Insights Enhancement - Professional layout & structured tagging

### ✅ **COMPLETED Feature** (`feature/universal-financial-tiles`)
- ✅ **Split LLM Architecture**: Focused dual-endpoint approach implemented and working
  - `/api/universal-metrics` - GAAP-focused financial metrics extraction (6hr cache)
  - `/api/company-insights` - Business intelligence extraction (12hr cache)
  - Independent loading, caching, and retry mechanisms
  - Real-time error handling and fallback strategies
- ✅ **Financial Metrics**: 8 GAAP-based KPI tiles **WORKING PERFECTLY**
  - **Revenue** ($1.498M, +24% YoY) with trend arrows showing real growth direction
  - **Gross Margin** (35.0%, +5.0pp) showing margin expansion
  - **Operating Margin** (0.7%, +2.5pp) operational efficiency
  - **Operating Income** ($10M, +131%) showing operational leverage
  - **Operating Cash Flow** data from cash flow statements
  - **R&D / Revenue** (ratio analysis for innovation investment)
  - **Net Income** (bottom-line profitability)
  - **Diluted EPS** (per-share earnings performance)
  - Layout: 4x2 responsive grid with real-time data from Q3 2025 SEC filings
  - Fixed refresh persistence - tiles remain visible after page reload
  - **Data Integrity**: Sparklines disabled until real historical data available (Issue #12)
  - Comprehensive debugging tools available: `checkContainers()`, `testLoadMetrics()`
- ✅ **Enhanced Company Insights**: Structured business intelligence extraction working
  - 8 insight categories: GROWTH-DRIVER 🚀, RISK ⚠, STRATEGIC-MOVE 🎯, etc.
  - Evidence attribution with SEC filing quotes and confidence scoring
  - Real Q3 2025 insights: "AI datacenter demand drives networking growth +45% YoY"

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
│   ├── universal-metrics.js     # Focused GAAP metrics extraction (NEW)
│   └── company-insights.js      # Business intelligence extraction (RENAMED)
├── lib/                          # Technical analysis & LLM utilities  
│   ├── technicalAnalysis.js     # Support/resistance calculation functions
│   ├── geminiService.js         # Google Gemini 2.5 Flash Lite LLM utilities
│   ├── metricsExtractor.js      # Specialized GAAP metrics extraction (NEW)
│   ├── insightsExtractor.js     # Company insights extraction (NEW)
│   ├── schemas.js               # Zod schema validation for LLM data
│   └── dataTransformer.js       # LLM data transformation pipeline
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
- `GET /api/universal-metrics?symbol=COHR` - ✨ NEW: Focused GAAP metrics extraction
- `GET /api/company-insights?symbol=COHR` - ✨ NEW: Business intelligence & insights

### Data Flow Architecture
1. **Stock Data**: Yahoo Finance chart API → Finnhub → Alpha Vantage → fallback APIs → demo data
2. **News Data**: Yahoo Finance search API → article summary extraction
3. **Analyst Data**: Yahoo Finance quoteSummary → fallback to research data
4. **Technical Analysis**: Yahoo Finance historical data → real support/resistance calculation
5. **Universal Metrics**: ✨ SEC EDGAR API → Focused GAAP extraction → structured financial KPIs
6. **Company Insights**: ✨ SEC EDGAR API → Business intelligence analysis → tagged insights
7. **Market Intelligence**: Legacy fallback system for segment data
8. **Frontend**: Split loading (metrics + insights), independent caching, granular retry buttons

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

### API Strategy & Error Handling
- **Stock Data**: Yahoo Finance chart API → Finnhub → Alpha Vantage → IEX → Error state
- **News Data**: Yahoo Finance search → article summary extraction → Error state
- **Analyst Data**: Finviz scraping → Finnhub consensus → Yahoo Finance → FMP → Error state
  - **Known Issue**: Finviz blocks Vercel serverless IPs, temporary hardcoded fallback for COHR
- **Technical Analysis**: Yahoo Finance historical → basic calculated indicators → Error state
- **Universal Metrics**: SEC EDGAR + Gemini LLM → Professional error state (NO fallback data)
- **Company Insights**: SEC EDGAR + Gemini LLM → Professional error state (NO fallback data)
- **Error Handling**: Professional error states with retry functionality, data integrity priority
- **Key Principle**: Never show misleading placeholder data - transparent failures only

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
- **Analyst consensus data** (Finnhub → Yahoo Finance quoteSummary) ⚠️ **PARTIAL**
  - **Consensus ratings**: ✅ Working (Buy consensus, distribution bars)
  - **Price targets**: ❌ **BLOCKED** - Finviz scraping fails in Vercel production
  - **EPS estimates**: ❌ **BLOCKED** - Shows "No Data" despite fallback implementation
  - **Status**: Critical user-facing data missing, development paused
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

**Issue #9: Universal Financial Metrics** ✅ **COMPLETE** (December 2025)
- ✅ Split LLM architecture with focused endpoints (`/api/universal-metrics` + `/api/company-insights`)
- ✅ 8 universal GAAP-based financial metrics replacing legacy segment tiles
- ✅ Real-time data extraction from Q3 2025 SEC filings using Google Gemini 2.5 Flash Lite
- ✅ Professional financial dashboard layout with sparklines and trend arrows
- ✅ Independent caching (6hr metrics, 12hr insights) and retry mechanisms
- ✅ Comprehensive debugging tools and error handling
- ✅ Fixed refresh persistence - tiles remain visible after page reload
- ✅ Removed legacy market trends container - clean single-purpose design

**Company Insights Enhancement** ✅ **COMPLETE** (December 2025)
- ✅ **Professional Category Framework**: 8 investment-focused categories (GROWTH-DRIVER 🚀, MARGIN-IMPACT 💰, RISK ⚠️, STRATEGIC-MOVE 🎯, CAPITAL-ALLOCATION 🏗️, INNOVATION 🧪, MARKET-DYNAMICS 📊, OPERATIONS 🛠️)
- ✅ **Enhanced Card Design**: Professional styling with gradients, improved spacing, typography, and visual hierarchy
- ✅ **Color-Coded Categories**: Consistent iconography and gradient backgrounds for each insight type
- ✅ **Improved Confidence Scoring**: High/medium/low color-coded indicators with professional styling
- ✅ **Enhanced Mobile Responsiveness**: Adaptive layouts, collapsible headers, and touch-friendly design
- ✅ **Professional Section Header**: Descriptive subtitle and dedicated refresh functionality
- ✅ **Investment-Grade LLM Prompts**: Focus on valuation-relevant insights, enhanced confidence criteria
- ✅ **Data Integrity Priority**: Removed ALL hardcoded fallbacks, professional error states, transparent failure handling
- ✅ **Enhanced Error Handling**: User-friendly error messages with retry functionality, maintains investment-grade data quality standards
- ✅ **Sparklines Data Integrity Fix**: Disabled hallucinated sparklines until real historical data available (Issue #12)

**Analyst Consensus Integration** ✅ **COMPLETE** (January 2025)
- ✅ **Integrated Analyst Card**: Single cohesive card replacing separate consensus/distribution tiles
- ✅ **Enhanced UX Design**: Professional layout with target price, upside, next Q EPS sections
- ✅ **Full Distribution Labels**: "Strong Buy", "Buy", "Hold", "Sell" instead of abbreviations
- ✅ **Visual Distribution Bar**: Dynamic percentage-based bars showing analyst sentiment
- ✅ **Finviz Integration**: Primary source for price targets ($96.06) and EPS estimates ($0.91)
- ✅ **Fixed Consensus Bug**: Corrected calculation preventing "Strong Buy" with only 26% ratings
- ⚠️ **Known Issue**: Finviz blocks Vercel serverless IPs, using temporary hardcoded fallback for COHR

### 🚧 NEXT PRIORITIES (Data Quality & Performance)

**⏸️ DEVELOPMENT STATUS**: Paused (January 2025 - User Travel Week)

**🚨 CRITICAL BLOCKING ISSUE**: Issue #14 - Finviz Scraping in Production
- **Problem**: Price targets and EPS estimates not displaying in Vercel production
- **Evidence**: Local ✅ works, Production ❌ shows "No Target"/"No Data"
- **Root Cause**: Vercel AWS Lambda IPs blocked by Finviz anti-scraping
- **Impact**: Critical user-facing data missing from analyst dashboard

**Primary Focus**: Resolve Finviz blocking before resuming other enhancements

0. **IMMEDIATE PRIORITY**: Issue #14 - Finviz Scraping Solution
   - **Recommended**: Try Vercel Edge Runtime (different IP pool, free)
   - **Backup Options**: 
     - ScrapingBee/ScraperAPI ($29-99/month)
     - GitHub Actions scheduled scraping with database
     - Alternative paid analyst data API
   - **Current Status**: Fallback hardcoded data implemented but not displaying

1. **Data Integrity Issues** (High Priority - Post-Travel)
   - Issue #10: Remove hardcoded analyst fallback data
   - Issue #12: Implement real 8-quarter historical sparklines 
   - Issue #13: Comprehensive caching strategy for multi-user scale
   - Maintain transparent error handling over misleading data

1. **Performance Optimization**
   - Server-side caching for API responses (beyond current session storage)
   - Loading state improvements and skeleton screens
   - API response time optimization
   - Bundle size optimization

2. **User Experience Polish**
   - Enhanced loading animations and transitions
   - Improved error recovery mechanisms
   - Better visual feedback for user actions
   - Accessibility improvements (ARIA labels, keyboard navigation)

3. **Data Source Transparency**
   - Enhanced data source panel with filing links
   - Timestamp accuracy improvements
   - Data freshness indicators
   - Source verification features

4. **Advanced Features**
   - Keyboard shortcuts for power users
   - Export functionality for insights data
   - Historical insights comparison
   - Customizable dashboard layout

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