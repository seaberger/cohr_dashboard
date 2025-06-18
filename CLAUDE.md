# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` or `vercel dev` - Start local development server with serverless functions
- `npm run start` - Alias for dev server
- **Important**: Create a `.env` file locally with API keys (see `.env` example in repo)

### Deployment
- Push to GitHub main branch - Automatic deployment via Vercel integration
- `vercel` - Manual deployment using Vercel CLI
- **Important**: Environment variables must be configured in Vercel dashboard before deployment

### Notes on Testing/Linting
Currently, no testing framework or linting tools are configured. The build command (`npm run build`) simply echoes a message since this is a static site.

## Architecture Overview

### Project Type
Static frontend with Vercel serverless functions for a financial investor dashboard tracking Coherent Corp (NASDAQ: COHR).

### Key Components

1. **Frontend (Missing in current structure)**
   - Main entry: `index.html` (referenced but not present)
   - Features: Real-time stock data, technical analysis, financial news, TradingView charts
   - Design: Responsive with glassmorphism effects

2. **API Layer** (`/src/api/`)
   - `stock.js` - Stock price data with multi-source fallback:
     - Primary: Finnhub API (env: `FINNHUB_API_KEY`)
     - Secondary: Alpha Vantage API (env: `ALPHA_VANTAGE_API_KEY`)
     - Tertiary: IEX Cloud (env: `IEX_API_KEY`)
     - Quaternary: Polygon.io (env: `POLYGON_API_KEY`)
     - Fallback: Simulated data
   - `news.js` - Financial news aggregation:
     - Primary: NewsAPI (env: `NEWS_API_KEY`) - if configured
     - Secondary: Bloomberg Markets RSS via RSS2JSON
     - Tertiary: TechCrunch RSS via RSS2JSON
     - Fallback: Curated COHR-specific news
   - `technical.js` - Technical indicators (RSI, MACD, Moving Averages, Support/Resistance)

3. **Infrastructure**
   - Platform: Vercel (serverless functions + static hosting)
   - Node.js version: 18+
   - Key dependencies: `node-fetch` (HTTP client), `cors` (CORS middleware)

### API Endpoints Pattern
All endpoints follow RESTful design with query parameters:
- `/api/stock?symbol=COHR`
- `/api/news?symbol=COHR&limit=5`
- `/api/technical?symbol=COHR&price=81.07`

### Environment Variables
Required for production deployment (configure in Vercel dashboard):
- `ALPHA_VANTAGE_API_KEY` - Stock market data
- `NEWS_API_KEY` - Financial news articles
- `FINNHUB_API_KEY` - Alternative stock data source
- `IEX_API_KEY` - Alternative stock data source
- `POLYGON_API_KEY` - Alternative stock data source

Optional configuration:
- `DEFAULT_SYMBOL` - Default stock symbol (default: COHR)
- `MAX_NEWS_ARTICLES` - Maximum news articles to return (default: 10)
- `REFRESH_INTERVAL_MS` - Frontend refresh interval in milliseconds

### Security Considerations
- API keys stored as environment variables (never in code)
- `.env` file excluded from version control via `.gitignore`
- CORS properly configured
- HTTPS enforced by Vercel
- No client-side exposure of sensitive data

### Development Workflow
1. Local development uses Vercel dev server to simulate serverless environment
2. Changes pushed to GitHub automatically deploy via Vercel integration
3. No build process required (static site)
4. Auto-refresh configured for 5-minute intervals on frontend