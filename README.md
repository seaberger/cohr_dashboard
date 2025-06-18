# COHR Investor Dashboard

A professional, real-time investor dashboard for Coherent Corp (NASDAQ: COHR) featuring live stock data, technical analysis, and financial news.

## 🚀 Features

- **Real-time Stock Data** - Live prices, changes, and market cap
- **Technical Analysis** - RSI, MACD, Moving Averages, Support/Resistance
- **Financial News** - Curated news from multiple sources
- **Interactive Charts** - TradingView integration with technical indicators
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Professional Styling** - Financial-grade UI with glassmorphism effects

## 📁 File Structure

```
cohr-dashboard/
├── index.html          # Main dashboard page
├── package.json        # Dependencies and scripts
├── vercel.json         # Vercel deployment configuration
├── README.md           # This file
└── api/
    ├── stock.js        # Stock data API endpoint
    ├── news.js         # News data API endpoint
    └── technical.js    # Technical indicators API endpoint
```

## 🛠 Setup & Deployment

### Prerequisites
- GitHub account
- Vercel account (free tier is sufficient)

### Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it something like `cohr-dashboard`
3. Initialize with a README (optional)

### Step 2: Add Files to Repository

Copy all the provided files into your repository:

1. **index.html** - The main dashboard file
2. **package.json** - Dependencies configuration
3. **vercel.json** - Vercel deployment settings
4. **README.md** - Documentation
5. **api/stock.js** - Stock data serverless function
6. **api/news.js** - News data serverless function
7. **api/technical.js** - Technical indicators serverless function

### Step 3: Deploy to Vercel

#### Option A: Automatic GitHub Integration (Recommended)

1. Go to [Vercel](https://vercel.com)
2. Sign up/login with your GitHub account
3. Click "New Project"
4. Import your `cohr-dashboard` repository
5. Vercel will automatically detect the configuration
6. Click "Deploy"
7. Your dashboard will be live in ~60 seconds!

#### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Clone your repository
git clone https://github.com/yourusername/cohr-dashboard.git
cd cohr-dashboard

# Deploy
vercel

# Follow the prompts to link to your Vercel account
```

### Step 4: Configure Custom Domain (Optional)

1. In Vercel dashboard, go to your project
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## 🔧 API Endpoints

Your deployed dashboard will have these endpoints:

- `https://your-app.vercel.app/api/stock?symbol=COHR`
- `https://your-app.vercel.app/api/news?symbol=COHR&limit=5`
- `https://your-app.vercel.app/api/technical?symbol=COHR&price=81.07`

## 📊 Data Sources

### Stock Data (with fallbacks):
1. **Finnhub.io** - Free sandbox API
2. **Alpha Vantage** - Your API key included
3. **IEX Cloud** - Free tier
4. **Simulated Data** - Realistic fallback

### News Data:
1. **RSS2JSON** - Bloomberg, TechCrunch feeds
2. **Curated COHR News** - Company-specific articles
3. **Financial News Aggregation** - Multiple sources

### Technical Indicators:
- **RSI (14-period)** - Relative Strength Index
- **MACD (12,26,9)** - Moving Average Convergence Divergence
- **Moving Averages** - 50-day and 200-day
- **Support/Resistance** - Dynamic price levels

## 🎨 Customization

### Change Stock Symbol
Update the `symbol` parameter in API calls:
```javascript
const response = await fetch('/api/stock?symbol=AAPL');
```

### Modify Technical Indicators
Edit `/api/technical.js` to adjust calculation parameters:
```javascript
// Change RSI period
const rsiPeriod = 14; // Default, change to 21 for longer term

// Modify MACD settings
const macdFast = 12;
const macdSlow = 26;
const macdSignal = 9;
```

### Update News Sources
Modify `/api/news.js` to add new RSS feeds:
```javascript
const newsFeed = 'https://feeds.reuters.com/reuters/businessNews';
```

## 🔒 Security Notes

- API keys are securely stored in serverless functions
- No client-side exposure of sensitive data
- CORS properly configured for cross-origin requests
- Rate limiting handled server-side

## 🚀 Performance

- **Fast Loading** - Static assets served via Vercel CDN
- **Serverless Functions** - Auto-scaling API endpoints
- **Caching** - Intelligent data caching to reduce API calls
- **Mobile Optimized** - Responsive design for all devices

## 📈 Monitoring

Monitor your dashboard performance:
1. Vercel Analytics (built-in)
2. Function logs in Vercel dashboard
3. API response times and errors

## 🆘 Troubleshooting

### Common Issues:

**API not loading data:**
- Check Vercel function logs
- Verify API keys are correct
- Test endpoints directly

**TradingView chart not loading:**
- Ensure HTTPS deployment
- Check browser console for errors
- Verify widget configuration

**Mobile display issues:**
- Test responsive breakpoints
- Check CSS media queries
- Validate viewport meta tag

## 📄 License

MIT License - feel free to modify and distribute.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For issues or questions:
1. Check Vercel function logs
2. Review browser console errors
3. Test API endpoints individually
4. Verify configuration files

---

**Live Demo:** `https://your-app.vercel.app`

**Repository:** `https://github.com/yourusername/cohr-dashboard`