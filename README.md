# COHR Investor Dashboard

**Status**: 🟢 **LIVE & DEPLOYED** | **Last Updated**: December 2025  
**Development Stage**: Data Integrity Enhanced ✅  
**Recent Achievement**: ✅ Fixed sparkline hallucination issue, maintained data integrity standards

A comprehensive, real-time investor dashboard for Coherent Corp (NASDAQ: COHR) featuring live stock data, real historical technical analysis, **LLM-powered SEC filing analysis**, and intelligent financial news. Built with Vercel serverless architecture and Google Gemini 2.5 Flash Lite for professional-grade financial analysis with investment-focused insights.

## 🎯 Live Dashboard

**✅ Currently Deployed**: The dashboard is live and operational on Vercel  
**🔄 Auto-Updates**: Stock data refreshes every 5 minutes  
**📱 Mobile Ready**: Responsive design works on all devices

## 🚀 Key Features

### 📊 **Financial Metrics** (NEW!)
- **8 Key Financial KPIs** applicable to any public company:
  - Total Revenue & Growth
  - Gross Margin & Operating Margin  
  - Free Cash Flow
  - R&D Investment (% of revenue)
  - Debt-to-Equity Ratio
  - Return on Assets (ROA)
  - EPS Growth
- **Color-coded trend indicators** for quick visual scanning
- **Data integrity focus** - real current quarter metrics only, no hallucinated historical data
- **Mobile-responsive grid layout** that adapts to any screen size

### 💡 **Professional Company Insights** (ENHANCED!)
- **Investment-grade analysis** with 8 professional categories:
  - **GROWTH-DRIVER** 🚀 - New revenue engines, secular tailwinds, market-share wins
  - **MARGIN-IMPACT** 💰 - Cost take-outs, mix shift, pricing power, commodity swings
  - **RISK** ⚠️ - Litigation, macro headwinds, regulatory changes, FX exposure
  - **STRATEGIC-MOVE** 🎯 - M&A, divestitures, new reporting segments, major hires
  - **CAPITAL-ALLOCATION** 🏗️ - Buybacks, dividends, debt pay-down/issuance, big cap-ex
  - **INNOVATION** 🧪 - Patents, product launches, R&D milestones
  - **MARKET-DYNAMICS** 📊 - Industry demand shifts, competitor actions, TAM changes
  - **OPERATIONS** 🛠️ - Supply-chain issues, manufacturing yields, plant closures/expansions
- **Color-coded confidence indicators** (high/medium/low)
- **Professional card design** with enhanced mobile responsiveness
- **Data integrity priority** - only real SEC filing data, no placeholder content

### ✅ **LIVE & REAL DATA**
- **Real-time Stock Prices** - Yahoo Finance chart API with intelligent fallbacks
- **Interactive Charts** - TradingView widget with professional technical overlays
- **Historical Technical Analysis** - Yahoo Finance 1-2 year historical data
  - Real support/resistance from swing highs/lows
  - Moving averages (20, 50, 200-day) as dynamic levels
  - RSI, MACD calculated from actual price history
- **LLM-Powered Business Intelligence** - Real Q3 2025 SEC filing analysis  
  - **AI Datacom: +45% YoY** (from SEC 10-Q filing)
  - **Networking: +45% YoY** (record performance)  
  - **Materials: -1% YoY** (sequential improvement)
  - **Lasers: +4% YoY** (steady growth)
  - **Total Revenue: $1.5B** (+24% YoY growth)
  - **Google Gemini 2.5 Flash Lite** extracts data from latest SEC filings
  - **Smart fallback** to Q2 2025 data if LLM analysis fails
  - **Visual indicators** show data source (LLM vs fallback)
- **COHR-Specific News** - Yahoo Finance search with article summaries
- **Analyst Consensus** - Finviz primary source with multi-API fallback strategy
  - **Price Targets**: $96.06 target with +18.5% upside calculation
  - **EPS Estimates**: $0.91 next quarter estimate
  - **Consensus Ratings**: Buy/Hold/Sell distribution with visual bars
- **Data Transparency** - Full source verification and methodology

### 🔜 **NEXT FEATURES**
- **Performance Optimization** - Enhanced loading states, server-side caching
- **User Experience Polish** - Improved animations, better error recovery
- **Data Source Transparency** - Enhanced filing links, freshness indicators
- **Advanced Features** - Export functionality, historical comparison tools

## 🏗️ Architecture

### **Tech Stack**
- **Frontend**: Static HTML5 + Vanilla JavaScript  
- **Backend**: Vercel Serverless Functions (Node.js)
- **LLM Integration**: Google Gemini 2.5 Flash Lite with SEC EDGAR API
- **Schema Validation**: Zod for robust data transformation
- **Deployment**: Vercel with GitHub integration
- **Charts**: TradingView widget
- **APIs**: Multi-source financial data with intelligent fallbacks

### **Project Structure**
```
/
├── index.html                    # Enhanced dashboard with real data
├── api/                          # Vercel serverless functions
│   ├── stock.js                 # Yahoo Finance real-time quotes (chart API)
│   ├── news.js                  # Yahoo Finance news with summaries
│   ├── analyst.js               # Yahoo Finance analyst consensus
│   ├── technical.js             # Basic technical indicators (fallback)
│   ├── technical-real.js        # Real historical technical analysis
│   ├── historical.js            # Yahoo Finance historical OHLCV
│   ├── sec-filings.js           # SEC EDGAR filing fetcher
│   ├── universal-metrics.js     # Focused GAAP metrics extraction
│   └── company-insights.js      # Business intelligence extraction
├── lib/                          # Technical analysis & LLM utilities  
│   ├── technicalAnalysis.js     # Support/resistance calculations
│   ├── geminiService.js         # Google Gemini 2.5 Flash Lite LLM utilities
│   ├── schemas.js               # Zod schema validation for LLM data
│   └── dataTransformer.js       # LLM data transformation pipeline
├── backups/                      # Original design files
├── docs/                         # Project documentation
│   └── LLM_INTEGRATION.md       # Comprehensive LLM integration guide
├── testing/                      # Test scripts and utilities
│   └── test-llm-integration.js  # LLM API testing script
├── DEVELOPMENT_ROADMAP.md        # 4-sprint development plan
├── package.json                  # Dependencies (node-fetch, @google/generative-ai, zod)
├── vercel.json                   # Deployment config
└── CLAUDE.md                     # Complete technical guide
```

## 🔧 API Endpoints

All endpoints include CORS support and 30-second timeout limits:

- **`GET /api/stock?symbol=COHR`** - Live stock price, change, market cap
- **`GET /api/news?symbol=COHR&limit=10`** - COHR-specific financial news with summaries
- **`GET /api/analyst?symbol=COHR&currentPrice={price}`** - Analyst consensus and price targets
- **`GET /api/technical-real?symbol=COHR&period=1y`** - Real historical technical analysis
- **`GET /api/historical?symbol=COHR&period=1y`** - Historical OHLCV data
- **`GET /api/sec-filings?symbol=COHR&type=10-Q`** - Latest SEC filing fetcher
- **`GET /api/universal-metrics?symbol=COHR`** - GAAP-focused financial metrics extraction
- **`GET /api/company-insights?symbol=COHR`** - Business intelligence & insights analysis

### **Enhanced Data Flow (LLM-Powered)**
1. **Stock Data**: Yahoo Finance chart API → Finnhub → Alpha Vantage → professional error handling
2. **News Data**: Yahoo Finance search → article summary extraction → transparent error states
3. **Analyst Data**: Finviz primary → Finnhub consensus → Yahoo Finance → professional error handling
4. **Technical Analysis**: Yahoo Finance historical → real support/resistance calculation
5. **Universal Metrics**: SEC EDGAR API → Google Gemini 2.5 Flash Lite → GAAP metrics extraction
6. **Company Insights**: SEC EDGAR API → Google Gemini 2.5 Flash Lite → investment-grade categorization
7. **Frontend**: 5-minute auto-refresh, independent refresh buttons, data integrity priority

## 📊 Data Quality & Sources

### **✅ LIVE & REAL DATA**
- **Stock prices and market data** (Yahoo Finance chart API - real-time)
- **Interactive charts** (TradingView with professional overlays)
- **Real technical analysis** (Yahoo Finance historical data)
  - Support/resistance from actual swing highs/lows
  - Moving averages calculated from historical prices
  - RSI, MACD from real price data
- **Financial Metrics** (Google Gemini 2.5 Flash Lite + SEC EDGAR)
  - 8 GAAP-based KPIs with trend arrows showing real growth direction
  - Real-time extraction from latest SEC filings
  - Data integrity priority: Historical sparklines disabled until real data available
  - Professional error handling when data unavailable
- **Company Insights** (Investment-grade categorization)
  - 8 professional categories for financial analysis
  - Color-coded confidence scoring
  - Only authentic SEC filing data - no placeholder content
- **COHR-specific news** (Yahoo Finance search API)
- **Analyst consensus data** (Finviz primary source with multi-API fallback)

### **🤖 LLM INTEGRATION STATUS**
- **Google Gemini 2.5 Flash Lite**: Deployed and analyzing latest SEC filings
- **SEC EDGAR Integration**: Fetching 10-Q/10-K filings automatically
- **Split Architecture**: Focused endpoints for metrics and insights
- **Cost**: <$1/month with smart caching strategies
- **Data Integrity**: Professional error states when analysis fails
- **Manual Refresh**: Independent refresh buttons for each section
- **Investment Grade**: Prioritizes accuracy over availability

### **❌ PLANNED ENHANCEMENTS**
- **Competitive positioning** (future Sprint 2 implementation)
- **Advanced export features** (historical data comparison)

## 🚀 Quick Deployment

### **For Users**
1. Visit the live dashboard URL (available in Vercel deployment)
2. No setup required - all data loads automatically
3. Bookmark for regular investment tracking

### **For Developers**
1. **Clone Repository**
   ```bash
   git clone https://github.com/seaberger/cohr_dashboard.git
   cd cohr_dashboard
   ```

2. **Local Development**
   ```bash
   npm install
   npm run dev  # Starts Vercel dev server
   ```

3. **Environment Setup**
   ```bash
   # Create .env file with your API keys
   ALPHA_VANTAGE_API_KEY=your_key_here  # Primary stock data source
   NEWS_API_KEY=your_key_here           # Financial news articles
   GEMINI_API_KEY=your_key_here         # Google Gemini 2.5 Flash Lite for LLM analysis
   ```

4. **Deploy to Vercel**
   - Connect GitHub repository to Vercel
   - Add environment variables in Vercel dashboard
   - Auto-deployment on main branch pushes

## 📈 Performance & Reliability

### **Current Metrics**
- **Page Load**: ~2-3 seconds
- **API Response**: 500ms-2s average
- **Uptime**: 99%+ (Vercel infrastructure)
- **Error Handling**: Graceful fallbacks prevent failures

### **Monitoring**
- Vercel function logs for API performance
- Browser console for frontend errors
- Real-time error tracking and alerting

## 🔒 Security & Privacy

- **API Keys**: Stored as environment variables, never in code
- **HTTPS**: Enforced by Vercel platform
- **CORS**: Properly configured for secure cross-origin requests
- **No Personal Data**: No user tracking or data collection

## 📖 Documentation

### **For Developers**
- **`CLAUDE.md`** - Complete technical architecture and development guide
- **`PROJECT_STATUS.md`** - Current project status and roadmap
- **`DATA_SOURCES.md`** - Detailed breakdown of all data sources

### **For Analysts/Investors**
- Real-time COHR stock tracking
- Professional-grade technical analysis
- Comprehensive financial news monitoring
- Mobile-accessible from anywhere

## 🔮 Development Roadmap

### **✅ COMPLETED SPRINTS**
**Sprint 1: Real Technical Analysis** ✅
- [x] Yahoo Finance historical data integration
- [x] Real support/resistance from swing highs/lows
- [x] Enhanced technical indicators (RSI, MACD, Volume)
- [x] Moving averages as dynamic support/resistance levels

**Sprint 3: Market Intelligence** ✅
- [x] COHR business segment performance data
- [x] Q2 2025 earnings-based market intelligence
- [x] Data transparency features with source verification
- [x] Quarterly update cycle aligned with earnings

**LLM Integration: Dynamic SEC Filing Analysis** ✅ (June 2025)
- [x] Google Gemini 2.5 Flash Lite integration for SEC filing analysis
- [x] Automatic fetching of latest 10-Q/10-K filings from SEC EDGAR
- [x] Real-time extraction of Q3 2025 business segment performance
- [x] Manual refresh functionality and enhanced error handling
- [x] Cost-effective implementation (<$1/month with caching)

**Financial Metrics & Company Insights Enhancement** ✅ (December 2025)
- [x] Split LLM architecture with focused dual endpoints
- [x] 8 universal GAAP-based financial metrics with trend arrows
- [x] Professional Company Insights with 8 investment-grade categories
- [x] Enhanced card design with gradients and improved typography
- [x] Color-coded confidence scoring and mobile responsiveness
- [x] Data integrity priority - removed all hardcoded fallbacks
- [x] Professional error handling with transparent failure states
- [x] Sparklines data integrity fix - disabled hallucinated historical data

**Analyst Consensus Integration** ✅ (January 2025)
- [x] Finviz primary source implementation with fallback strategy
- [x] Real price targets ($96.06) and EPS estimates ($0.91) displaying
- [x] Enhanced analyst card with consensus ratings and visual distribution bars
- [x] Removed Enhanced Analytics button and Chart.js dependencies
- [x] Code simplification maintaining core analyst functionality

### **🚧 NEXT PRIORITIES**
**Data Integrity & Performance** - Current Focus
- [ ] **Issue #10**: Remove hardcoded analyst fallback data
- [ ] **Issue #12**: Implement real 8-quarter historical sparklines
- [ ] **Issue #13**: Comprehensive caching strategy for multi-user scale
- [ ] Performance optimization and enhanced loading states
- [ ] Advanced user experience improvements
- [ ] Data source transparency enhancements
- [ ] Accessibility and keyboard navigation improvements

**Sprint 2: Competitive Intelligence** (Future)
- [ ] Competitive positioning section (currently hidden)
- [ ] Peer company performance comparison
- [ ] Relative stock performance vs competitors
- [ ] Industry positioning and market share data

**Sprint 4: AI Integration** (Future)
- [ ] OpenAI-powered news sentiment analysis
- [ ] AI-generated investment insights
- [ ] Interactive Q&A about COHR performance
- [ ] Automated earnings analysis and alerts

### **🔧 TECHNICAL IMPROVEMENTS**
- [ ] Server-side caching for API responses
- [ ] Enhanced error handling UI
- [ ] Performance optimization
- [ ] WebSocket real-time data feeds

## 🤝 Contributing

This project is designed for financial analysis and investment research. Contributions welcome for:

- Data source improvements
- UI/UX enhancements
- Performance optimizations
- New financial metrics

## 📞 Support

### **Technical Issues**
- Check Vercel function logs for API errors
- Review browser console for frontend issues
- Test API endpoints directly for debugging

### **Data Quality**
- Report inaccurate data via GitHub issues
- Suggest new data sources or improvements
- Request additional financial metrics

---

**Investment Disclaimer**: This dashboard is for informational purposes only. Not financial advice. Always consult with financial professionals before making investment decisions.

**Repository**: [github.com/seaberger/cohr_dashboard](https://github.com/seaberger/cohr_dashboard)  
**Live Dashboard**: Available via Vercel deployment URL