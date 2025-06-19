# LLM Integration Documentation

## Overview

The COHR Dashboard now includes Google Gemini 2.5 Flash integration for dynamic analysis of SEC filings, automatically extracting business segment performance data to replace static quarterly data.

## Architecture

```
Frontend → /api/market-trends → /api/analyze-segments → /api/sec-filings → SEC EDGAR
                ↓                        ↓                      ↓
         LLM Analysis Pipeline    Google Gemini 2.5     Latest 10-Q/10-K
                ↓
         Dynamic Market Tiles
```

## API Endpoints

### 1. `/api/market-trends`

Enhanced market intelligence endpoint with LLM integration.

**Parameters:**
- `symbol` (default: 'COHR') - Stock ticker symbol
- `useLLM` (default: 'true') - Enable/disable LLM analysis

**Response:**
```json
{
  "status": "success",
  "dataSource": "LLM Analysis | Static Fallback Data",
  "analysisMethod": "Google Gemini 2.5 Flash",
  "filing": {
    "quarter": "Q3 2025",
    "date": "2025-xx-xx"
  },
  "marketIntelligence": {
    "aiDatacomGrowth": {
      "cohrDatacomGrowthYoY": "+XX%",
      "keyDriver": "AI datacenter demand...",
      "status": "Performance summary"
    }
  }
}
```

### 2. `/api/sec-filings`

Fetches latest SEC filings from EDGAR database.

**Parameters:**
- `symbol` (default: 'COHR') - Stock ticker symbol  
- `type` (default: '10-Q') - Filing type (10-Q, 10-K)

**Features:**
- 24-hour caching to minimize SEC API calls
- Extracts key sections (MD&A, Business Segments)
- Handles HTML parsing and text cleanup
- Rate limiting and error handling

### 3. `/api/analyze-segments`

Uses Google Gemini 2.5 Flash to extract structured business data.

**Parameters:**
- `symbol` (default: 'COHR') - Stock ticker symbol
- `refresh` (default: 'false') - Force new analysis

**Features:**
- 7-day caching for analysis results
- Structured JSON extraction from SEC text
- Data validation and confidence scoring
- Fallback to previous quarter if analysis fails

## Environment Configuration

### Required Environment Variables

```bash
# Google Gemini API Key (required for LLM functionality)
GEMINI_API_KEY=your_api_key_here
```

Get your API key: https://makersuite.google.com/app/apikey

### Optional Configuration

```bash
# Base URLs for testing
VERCEL_URL=your-deployment-url
BASE_URL=http://localhost:3000  # for local testing
```

## Cost Analysis

### Google Gemini 2.5 Flash Pricing
- **Input tokens**: ~$0.015 per 1M tokens
- **Output tokens**: ~$0.06 per 1M tokens

### Typical Usage
- Average 10-Q filing: ~50,000 tokens input
- Analysis output: ~2,000 tokens
- **Cost per analysis**: ~$0.001 (0.1 cent)
- **Monthly cost** (daily refresh): ~$0.03

### Caching Strategy
- SEC filings cached 24 hours
- Analysis results cached 7 days
- **Estimated monthly cost**: <$1

## Prompt Engineering

### Business Segment Extraction Prompt

```
You are a financial analyst expert. Extract business segment performance data from this SEC filing.

Instructions:
1. Find all business segments mentioned with revenue figures
2. Calculate year-over-year (YoY) and quarter-over-quarter (QoQ) growth percentages
3. Identify key growth drivers and performance status for each segment
4. Extract overall company performance metrics

Return ONLY a valid JSON object with this exact structure...
```

### Key Prompt Features
- Low temperature (0.2) for consistent extraction
- Structured JSON output format
- Validation requirements
- Error handling instructions

## Frontend Integration

### Visual Indicators

**Data Source Colors:**
- 🟢 Green: LLM-analyzed latest data
- 🟠 Orange: Static fallback data  
- 🔵 Blue: Loading/processing

**User Controls:**
- 🔄 Manual refresh button
- 📊 Data sources panel
- ⚠️ Error notifications

### Code Examples

```javascript
// Check if using LLM analysis
if (data.dataSource === 'LLM Analysis') {
  const quarter = data.filing?.quarter || 'Latest';
  title.innerHTML = `COHR Performance ${quarter} (LLM Analyzed)`;
}

// Manual refresh with cache bypass
const response = await fetch(`/api/market-trends?refresh=true&t=${Date.now()}`);
```

## Error Handling & Fallbacks

### 1. SEC API Failures
- **Fallback**: Use cached filing data
- **Timeout**: 30 seconds
- **Retry**: Exponential backoff

### 2. Gemini API Failures  
- **Fallback**: Static Q2 2025 data
- **Rate limiting**: 1 second between requests
- **Cost protection**: Usage monitoring

### 3. Data Validation Failures
- **Fallback**: Previous quarter data
- **Logging**: Error details for debugging
- **User notification**: Warning messages

## Testing

### Local Testing

```bash
# Run test script
node testing/test-llm-integration.js

# Manual API testing
curl "http://localhost:3000/api/market-trends?useLLM=true"
curl "http://localhost:3000/api/sec-filings?symbol=COHR"
```

### Production Testing

```bash
# Test with environment variables
GEMINI_API_KEY=your_key BASE_URL=https://your-app.vercel.app node testing/test-llm-integration.js
```

## Deployment

### Vercel Configuration

1. **Add Environment Variable:**
   ```
   GEMINI_API_KEY = your_api_key_here
   ```

2. **Deploy:**
   ```bash
   git push origin feature/llm-sec-filing-analysis
   # Auto-deploys via GitHub integration
   ```

3. **Verify:**
   - Check Vercel function logs
   - Test API endpoints
   - Monitor LLM usage costs

## Monitoring & Maintenance

### Key Metrics to Monitor
- LLM API response times (target: <10 seconds)
- Error rates (target: <5%)
- Cost per analysis (target: <$0.002)
- Cache hit rates (target: >80%)

### Regular Maintenance
- Review quarterly filings for accuracy
- Update prompts based on filing format changes
- Monitor Google Gemini API updates
- Rotate API keys as needed

## Future Enhancements

### Phase 2: Multi-Company Support
- Dynamic ticker selection integration
- Company-specific prompt optimization
- Automated filing type detection

### Phase 3: Advanced Analysis
- Competitive comparison analysis
- Trend identification across quarters
- Forward guidance extraction

### Phase 4: Real-time Updates
- SEC filing webhooks/notifications
- Automated refresh triggers
- Alert system for significant changes

## Troubleshooting

### Common Issues

**"LLM analysis failed" error:**
- Check GEMINI_API_KEY is set correctly
- Verify API key has sufficient credits
- Check Vercel function logs for details

**"No filing content found" error:**
- SEC EDGAR may be temporarily unavailable
- Filing may not exist for requested period
- Check symbol spelling and filing type

**Slow response times:**
- Normal for first request (no cache)
- LLM processing takes 5-15 seconds
- Consider increasing function timeout

### Debug Commands

```bash
# Check environment variables
vercel env ls

# View function logs
vercel logs

# Test individual APIs
curl -v "https://your-app.vercel.app/api/sec-filings?symbol=COHR"
```

## Security Considerations

### API Key Protection
- ✅ Stored as environment variable
- ✅ Never logged or exposed to frontend
- ✅ Excluded from version control

### Rate Limiting
- ✅ 1 second minimum between Gemini requests
- ✅ 24-hour SEC filing cache
- ✅ 7-day analysis cache

### Input Validation
- ✅ Symbol parameter sanitization
- ✅ Filing content size limits
- ✅ JSON response validation

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Status**: Production Ready