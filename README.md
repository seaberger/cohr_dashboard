# COHR Investor Dashboard

**Status**: 🟢 **LIVE & DEPLOYED** | **Last Updated**: January 2025  
**Development Stage**: Sprint 3 Complete (Technical Analysis ✅, Market Intelligence ✅)  
**Recent Fix**: ✅ Live stock price display now working with Yahoo Finance chart API

A comprehensive, real-time investor dashboard for Coherent Corp (NASDAQ: COHR) featuring live stock data, real historical technical analysis, COHR business segment performance, and intelligent financial news. Built with Vercel serverless architecture for professional-grade financial analysis.

## 🎯 Live Dashboard

**✅ Currently Deployed**: The dashboard is live and operational on Vercel  
**🔄 Auto-Updates**: Stock data refreshes every 5 minutes  
**📱 Mobile Ready**: Responsive design works on all devices

## 🚀 Key Features

### ✅ **LIVE & REAL DATA**
- **Real-time Stock Prices** - Yahoo Finance chart API with intelligent fallbacks
- **Interactive Charts** - TradingView widget with professional technical overlays
- **Historical Technical Analysis** - Yahoo Finance 1-2 year historical data
  - Real support/resistance from swing highs/lows
  - Moving averages (20, 50, 200-day) as dynamic levels
  - RSI, MACD calculated from actual price history
- **COHR Business Intelligence** - Q2 2025 earnings segment performance
  - AI Datacom: +79% YoY growth (all-time high)
  - Networking: +56% YoY growth (record performance)
  - Telecom: +11% YoY growth
  - Industrial Lasers: +6% YoY growth
- **COHR-Specific News** - Yahoo Finance search with article summaries
- **Analyst Consensus** - Yahoo Finance quoteSummary API data
- **Data Transparency** - Full source verification and methodology

### 🔜 **PLANNED FEATURES (Next Sprints)**
- **Competitive Intelligence** - Peer company performance comparison (Sprint 2)
- **AI-Powered Insights** - OpenAI integration for sentiment analysis (Sprint 4)

## 🏗️ Architecture

### **Tech Stack**
- **Frontend**: Static HTML5 + Vanilla JavaScript
- **Backend**: Vercel Serverless Functions (Node.js)
- **Deployment**: Vercel with GitHub integration
- **Charts**: TradingView widget
- **APIs**: Multi-source financial data with intelligent fallbacks

### **Project Structure**
```
/
├── index.html                    # Enhanced dashboard with real data
├── api/                          # Vercel serverless functions
│   ├── stock.js                 # Yahoo Finance real-time quotes
│   ├── news.js                  # Yahoo Finance news with summaries
│   ├── analyst.js               # Yahoo Finance analyst consensus
│   ├── technical.js             # Basic technical indicators (fallback)
│   ├── technical-real.js        # Real historical technical analysis
│   ├── historical.js            # Yahoo Finance historical OHLCV
│   └── market-trends.js         # COHR business segment performance
├── lib/                          # Technical analysis libraries
│   └── technicalAnalysis.js     # Support/resistance calculations
├── backups/                      # Original design files
├── docs/                         # Project documentation
├── DEVELOPMENT_ROADMAP.md        # 4-sprint development plan
├── package.json                  # Dependencies
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
- **`GET /api/market-trends`** - COHR business segment performance (Q2 2025)

### **Enhanced Data Flow**
1. **Stock Data**: Yahoo Finance chart API → fallback APIs → demo data
2. **News Data**: Yahoo Finance search → article summary extraction → curated fallback
3. **Analyst Data**: Yahoo Finance quoteSummary → research-compiled data
4. **Technical Analysis**: Yahoo Finance historical → real support/resistance calculation
5. **Market Intelligence**: COHR Q2 2025 earnings → business segment performance
6. **Frontend**: 5-minute auto-refresh with enhanced technical analysis and data transparency

## 📊 Data Quality & Sources

### **✅ LIVE & REAL DATA**
- **Stock prices and market data** (Yahoo Finance chart API - real-time)
- **Interactive charts** (TradingView with professional overlays)
- **Real technical analysis** (Yahoo Finance historical data)
  - Support/resistance from actual swing highs/lows
  - Moving averages calculated from historical prices
  - RSI, MACD from real price data
- **COHR business segment performance** (Q2 2025 earnings)
- **COHR-specific news** (Yahoo Finance search API)
- **Analyst consensus data** (Yahoo Finance quoteSummary)

### **⚠️ QUARTERLY UPDATED DATA**
- **Market Intelligence**: COHR Q2 2025 earnings performance
- **Business segment growth**: Updated with each earnings report
- **Data transparency**: Full source verification available

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
   # Create .env file with your API keys (optional for enhanced features)
   ALPHA_VANTAGE_API_KEY=your_key_here  # Fallback stock data
   NEWS_API_KEY=your_key_here           # Additional news sources
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

### **🚧 NEXT PRIORITIES**
**Sprint 2: Competitive Intelligence** (Next)
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