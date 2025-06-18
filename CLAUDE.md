# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**COHR Investor Dashboard** - A professional, real-time financial dashboard for Coherent Corp (NASDAQ: COHR) featuring live stock data, technical analysis, and financial news.

**Status**: ✅ **DEPLOYED AND LIVE** on Vercel  
**Live URL**: Available in Vercel dashboard  
**Last Updated**: December 2024

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
├── index.html              # Main dashboard (hybrid design)
├── api/                    # Vercel serverless functions
│   ├── stock.js           # Multi-source stock data with fallbacks
│   ├── news.js            # News aggregation (NewsAPI + RSS feeds)
│   └── technical.js       # Technical indicators calculation
├── backups/               # Original design files
├── docs/                  # Deployment and project documentation
├── package.json           # Dependencies (node-fetch, cors)
├── vercel.json            # Deployment configuration
└── .env                   # API keys (local only, gitignored)
```

### API Endpoints
All endpoints support CORS and have 30-second timeout limits:
- `GET /api/stock?symbol=COHR` - Stock price, market cap, change data
- `GET /api/news?symbol=COHR&limit=10` - Financial news articles
- `GET /api/technical?symbol=COHR&price={price}` - Technical indicators

### Data Flow Architecture
1. **Stock Data**: Multi-source cascade (Alpha Vantage → fallback APIs → demo data)
2. **News Data**: NewsAPI (if key present) → RSS feeds → curated fallback
3. **Technical Data**: Real-time calculation based on current stock price
4. **Frontend**: 5-minute auto-refresh, real-time updates

## Environment Variables

### Required (Production)
```
ALPHA_VANTAGE_API_KEY=your_key_here     # Primary stock data source
NEWS_API_KEY=your_key_here              # Financial news articles
```

### Optional (Configuration)
```
DEFAULT_SYMBOL=COHR                     # Default stock symbol
MAX_NEWS_ARTICLES=10                    # Max news articles to return
REFRESH_INTERVAL_MS=300000              # Frontend refresh interval
```

### API Fallback Strategy
- **Stock Data**: Alpha Vantage → Finnhub → IEX → Polygon → Demo data
- **News Data**: NewsAPI → Bloomberg RSS → TechCrunch RSS → Curated fallback
- **Error Handling**: Graceful degradation, never breaks dashboard

## Current Data Sources Status

### ✅ LIVE & REAL
- Stock price, change, market cap (Alpha Vantage)
- TradingView interactive charts
- Technical indicators (calculated from real price)
- News articles (when API keys configured)

### ❌ EXAMPLE/STATIC DATA  
- Analyst consensus, price targets, upside estimates
- Support/resistance levels (calculated as price percentages)
- Competitive positioning table
- Industry market trend statistics

## Known Issues & Next Steps

### Immediate Priorities
1. **Real Analyst Data**: Integrate Financial Modeling Prep or Finnhub API for consensus ratings
2. **Support/Resistance**: Replace calculated levels with real technical analysis
3. **News Relevance**: Improve COHR-specific news filtering
4. **Environment Variables**: Ensure all API keys properly configured in Vercel

### Technical Debt
- Add proper error handling UI
- Implement loading states for all data sections
- Add retry logic for failed API calls
- Consider adding data caching strategy

### Future Enhancements
- Real-time WebSocket data feeds
- Portfolio tracking capabilities
- Multiple stock symbol support
- User authentication and preferences

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