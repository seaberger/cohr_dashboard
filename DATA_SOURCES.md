# DATA SOURCES DOCUMENTATION

**Last Updated**: December 19, 2024  
**Purpose**: Track real vs example data sources across the COHR Dashboard

## Real-Time Data Sources ✅

### Stock Market Data
| Data Point | Source | API Endpoint | Update Frequency | Quality |
|------------|---------|--------------|------------------|---------|
| **Stock Price** | Alpha Vantage | `/api/stock` | Real-time | High ✅ |
| **Price Change** | Alpha Vantage | `/api/stock` | Real-time | High ✅ |
| **Market Cap** | Calculated | Current price × 155M shares | Real-time | High ✅ |
| **Volume** | Alpha Vantage | `/api/stock` | Real-time | High ✅ |
| **OHLC Data** | Alpha Vantage | `/api/stock` | Real-time | High ✅ |

### Chart Data
| Component | Source | Integration | Update Frequency | Quality |
|-----------|---------|-------------|------------------|---------|
| **Interactive Chart** | TradingView | Widget API | Real-time | High ✅ |
| **Candlestick Data** | TradingView | Direct feed | Real-time | High ✅ |
| **Volume Bars** | TradingView | Direct feed | Real-time | High ✅ |

### Technical Indicators
| Indicator | Source | Calculation | Update Frequency | Quality |
|-----------|---------|-------------|------------------|---------|
| **RSI (14)** | Calculated | `/api/technical` | Per price update | Medium ⚠️ |
| **MACD** | Calculated | `/api/technical` | Per price update | Medium ⚠️ |
| **50-Day MA** | Calculated | `/api/technical` | Per price update | Medium ⚠️ |
| **200-Day MA** | Calculated | `/api/technical` | Per price update | Medium ⚠️ |

**Note**: Technical indicators are calculated using current price with randomization for demo purposes. They need historical price data for accuracy.

### News Data
| Source | API | Relevance | Update Frequency | Quality |
|---------|-----|-----------|------------------|---------|
| **NewsAPI** | `/api/news` | COHR-specific search | Hourly | Medium ⚠️ |
| **Bloomberg RSS** | RSS2JSON | General tech/finance | Hourly | Low ⚠️ |
| **TechCrunch RSS** | RSS2JSON | General tech | Hourly | Low ⚠️ |

**Current Issue**: News often lacks COHR relevance, needs better filtering algorithms.

---

## Example/Demo Data Sources ❌

### Analyst Information
| Data Point | Current Display | Actual Source | Status |
|------------|------------------|---------------|---------|
| **Consensus Rating** | "Example Data" | Hardcoded | ❌ Needs Real API |
| **Average Price Target** | "TBD" | Hardcoded | ❌ Needs Real API |
| **Upside Potential** | "TBD" | Hardcoded | ❌ Needs Real API |

**Required**: Financial Modeling Prep or Finnhub API integration for real analyst data.

### Support & Resistance Levels
| Level Type | Current Calculation | Quality | Status |
|------------|-------------------|---------|---------|
| **Resistance 1** | Current price × 1.05 | Demo | ❌ Needs Real Analysis |
| **Resistance 2** | Current price × 1.11 | Demo | ❌ Needs Real Analysis |
| **Resistance 3** | Current price × 1.17 | Demo | ❌ Needs Real Analysis |
| **Support 1** | Current price × 0.95 | Demo | ❌ Needs Real Analysis |
| **Support 2** | Current price × 0.90 | Demo | ❌ Needs Real Analysis |
| **Support 3** | Current price × 0.86 | Demo | ❌ Needs Real Analysis |

**Required**: Historical price analysis or professional technical analysis API.

### Competitive Landscape
| Information | Current Source | Status |
|-------------|----------------|---------|
| **Market Position** | Manual research | ❌ Static |
| **Key Competitors** | Manual research | ❌ Static |
| **Primary Markets** | Manual research | ❌ Static |
| **Differentiation** | Manual research | ❌ Static |

**Required**: Automated competitive intelligence API or regular manual updates.

### Industry & Market Trends
| Metric | Current Value | Source | Status |
|---------|---------------|---------|---------|
| **2029 Market Size** | $25.8B | Manual research | ❌ Static |
| **CAGR 2024-2029** | 13.2% | Manual research | ❌ Static |
| **Technology Trends** | 800G+ speeds | Manual research | ❌ Static |
| **User Projections** | 5.16B users | Manual research | ❌ Static |

**Required**: Market research API integration or quarterly manual updates.

---

## API Configuration

### Environment Variables (Production)
```env
# CONFIGURED ✅
ALPHA_VANTAGE_API_KEY=THCMA0ADG425WSVX
NEWS_API_KEY=ca6ebedf9b0c40a285699a61025fbb44
DEFAULT_SYMBOL=COHR
MAX_NEWS_ARTICLES=10

# NEEDED FOR REAL ANALYST DATA ❌
FINANCIAL_MODELING_PREP_API_KEY=not_configured
FINNHUB_API_KEY=not_configured
```

### API Rate Limits & Costs
| Service | Plan | Rate Limit | Monthly Quota | Cost |
|---------|------|------------|---------------|------|
| **Alpha Vantage** | Free | 25 req/day | 25 calls | Free |
| **NewsAPI** | Free | 1000 req/month | 1000 calls | Free |
| **TradingView** | Widget | Unlimited | N/A | Free |
| **Financial Modeling Prep** | Not configured | TBD | TBD | Free tier available |
| **Finnhub** | Not configured | TBD | TBD | Free tier available |

---

## Data Quality Assessment

### High Quality ✅ (Production Ready)
- Stock price, change, volume from Alpha Vantage
- Interactive charts from TradingView
- Market cap calculations
- Basic news aggregation infrastructure

### Medium Quality ⚠️ (Functional but Improvable)
- Technical indicators (need historical data)
- News relevance (needs better filtering)
- API fallback mechanisms

### Low Quality ❌ (Demo Data Only)
- All analyst information
- Support/resistance levels
- Competitive positioning
- Market trend statistics

---

## Recommended Improvements

### Phase 1: Critical Data (Week 1-2)
1. **Integrate Financial Modeling Prep API**
   - Analyst consensus ratings
   - Price targets and recommendations
   - Earnings estimates

2. **Improve Technical Analysis**
   - Historical price data for proper MA calculations
   - Real support/resistance from chart patterns
   - Volume-based indicators

### Phase 2: Enhanced Intelligence (Week 3-4)
1. **News Enhancement**
   - Implement COHR-specific keyword scoring
   - Add sentiment analysis
   - Filter for material news events

2. **Competitive Intelligence**
   - Automated peer comparison data
   - Industry benchmark tracking
   - Market share analytics

### Phase 3: Professional Features (Month 2)
1. **Real-time Feeds**
   - WebSocket connections for live updates
   - Intraday technical analysis
   - Breaking news alerts

2. **Advanced Analytics**
   - Options data integration
   - Institutional holdings tracking
   - SEC filing monitoring

---

## Data Validation Checklist

### Before Claiming "Real Data" ✓
- [ ] Data source is documented and verified
- [ ] Update frequency is appropriate for use case
- [ ] Error handling prevents bad data display
- [ ] Fallback mechanism exists for API failures
- [ ] Cost and rate limits are sustainable

### Quality Assurance Process
1. **Manual Verification**: Compare against Yahoo Finance/Bloomberg
2. **Automated Testing**: API endpoint health checks
3. **User Feedback**: Monitor for reported inaccuracies
4. **Regular Audits**: Monthly data source review

---

## Emergency Procedures

### API Failure Response
1. **Alpha Vantage Down**: Automatic fallback to other stock APIs
2. **NewsAPI Down**: Fall back to RSS feeds and curated content
3. **TradingView Issues**: Display static message with basic price data
4. **Complete Failure**: Show last cached data with clear timestamps

### Data Quality Issues
1. **Incorrect Prices**: Immediate investigation and potential API switch
2. **Stale Data**: Clear "last updated" timestamps and warnings
3. **Missing Data**: Graceful degradation with explanatory messages
4. **User Reports**: Document, investigate, and respond within 24 hours