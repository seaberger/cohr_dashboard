# COHR Investor Dashboard

**Status**: 🟢 **LIVE & DEPLOYED** | **Last Updated**: June 2025  
**Development Stage**: Sprint 3 Complete + LLM Integration ✅ (Real Q3 2025 SEC Data)  
**Recent Achievement**: ✅ Google Gemini 2.5 Flash Lite integration for dynamic SEC filing analysis

A comprehensive, real-time investor dashboard for Coherent Corp (NASDAQ: COHR) featuring live stock data, real historical technical analysis, **LLM-powered SEC filing analysis**, and intelligent financial news. Built with Vercel serverless architecture and Google Gemini 2.5 Flash Lite for professional-grade financial analysis with real Q3 2025 business segment data.

## 🎯 Live Dashboard

**✅ Currently Deployed**: The dashboard is live and operational on Vercel  
**🔄 Auto-Updates**: Stock data refreshes every 5 minutes  
**📱 Mobile Ready**: Responsive design works on all devices

## 🚀 Key Features

### 📊 **Universal Financial Metrics** (NEW!)
- **8 Key Financial KPIs** applicable to any public company:
  - Total Revenue & Growth
  - Gross Margin & Operating Margin  
  - Free Cash Flow
  - R&D Investment (% of revenue)
  - Debt-to-Equity Ratio
  - Return on Assets (ROA)
  - EPS Growth
- **Color-coded trend indicators** for quick visual scanning
- **Mobile-responsive grid layout** that adapts to any screen size

### 💡 **AI-Powered Company Insights** (NEW!)
- **Dynamic insights extraction** from SEC filings:
  - Growth drivers and catalysts
  - Risk factors and headwinds
  - Strategic initiatives
  - Competitive advantages
  - Management guidance highlights
- **Impact indicators** (positive/negative/neutral)
- **Confidence scoring** for each insight
- **Source attribution** from filing text

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
- **Analyst Consensus** - Yahoo Finance quoteSummary API data
- **Data Transparency** - Full source verification and methodology

### 🔜 **NEXT FEATURES (Segment Tiles Enhancement)**
- **Visual Improvements** - Color-coded growth indicators, mobile-responsive grid
- **Key Insights Integration** - LLM-generated growth drivers, risks, margin analysis  
- **Performance Enhancements** - Edge caching, timeout handling, better UX
- **Future**: Competitive Intelligence, Advanced AI Integration

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
│   ├── market-trends.js         # Enhanced with LLM analysis + Q2 2025 fallback
│   ├── sec-filings.js           # SEC EDGAR filing fetcher
│   └── analyze-segments.js      # Google Gemini 2.5 Flash Lite LLM analysis
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
- **`GET /api/market-trends?useLLM=true`** - Enhanced with LLM analysis + Q2 2025 fallback
- **`GET /api/sec-filings?symbol=COHR&type=10-Q`** - Latest SEC filing fetcher
- **`GET /api/analyze-segments?symbol=COHR`** - LLM analysis of business segments

### **Enhanced Data Flow (LLM-Powered)**
1. **Stock Data**: Yahoo Finance chart API → Finnhub → Alpha Vantage → fallback APIs → demo data
2. **News Data**: Yahoo Finance search → article summary extraction → curated fallback
3. **Analyst Data**: Yahoo Finance quoteSummary → research-compiled consensus data
4. **Technical Analysis**: Yahoo Finance historical → real support/resistance calculation
5. **Market Intelligence**: SEC EDGAR API → Google Gemini 2.5 Flash Lite → dynamic analysis → Q2 2025 fallback
6. **LLM Pipeline**: SEC filing text → Gemini analysis → structured JSON → frontend tiles
7. **Frontend**: 5-minute auto-refresh, LLM indicators, manual refresh, data transparency

## 📊 Data Quality & Sources

### **✅ LIVE & REAL DATA**
- **Stock prices and market data** (Yahoo Finance chart API - real-time)
- **Interactive charts** (TradingView with professional overlays)
- **Real technical analysis** (Yahoo Finance historical data)
  - Support/resistance from actual swing highs/lows
  - Moving averages calculated from historical prices
  - RSI, MACD from real price data
- **Dynamic business segment performance** (Google Gemini 2.5 Flash Lite + SEC EDGAR)
  - **Q3 2025 Real Data**: $1.5B revenue (+24% YoY)
  - Networking: +45% YoY growth (AI datacenter demand)
  - Materials: -1% YoY (improved from Q2's -4%)
  - Lasers: +4% YoY growth (display & semiconductor equipment)
  - **Smart Fallback**: Q2 2025 data if LLM analysis fails
- **COHR-specific news** (Yahoo Finance search API)
- **Analyst consensus data** (Yahoo Finance quoteSummary)

### **🤖 LLM INTEGRATION STATUS**
- **Google Gemini 2.5 Flash Lite**: Deployed and analyzing latest SEC filings
- **SEC EDGAR Integration**: Fetching 10-Q/10-K filings automatically
- **Data Extraction**: Q3 2025 real segment performance extracted successfully
- **Cost**: <$1/month with smart caching (24hr filing cache, 7-day analysis cache)
- **Visual Indicators**: Green = LLM analyzed, Orange = Q2 fallback
- **Manual Refresh**: Users can trigger latest filing analysis
- **Error Handling**: Graceful fallback to Q2 2025 static data

### **❌ HIDDEN/PLANNED DATA**
- **Competitive positioning** (hidden until Sprint 2 implementation)
- **AI-powered insights** (planned for Sprint 4 with OpenAI integration)

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
- [x] Smart fallback to Q2 2025 data with visual indicators
- [x] Manual refresh functionality and enhanced error handling
- [x] Cost-effective implementation (<$1/month with caching)

### **🚧 NEXT PRIORITIES**
**Segment Tiles Enhancement (Issue #9)** - Current Focus
- [ ] Visual & UX improvements (color-coded growth indicators)
- [ ] Mobile-responsive CSS Grid layout with click-for-details
- [ ] LLM-generated key insights (growth drivers, risks, margin analysis)
- [ ] Performance optimizations (caching, timeout handling)

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