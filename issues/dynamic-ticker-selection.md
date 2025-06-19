# [FEATURE] Dynamic Stock Ticker Selection with Auto-Complete Search

## Feature Description

Add the ability for users to dynamically search for and select different stock tickers or company names, replacing the current hardcoded COHR ticker. This would transform the dashboard from a single-company view to a multi-company financial analysis tool.

## User Story

As a user, I want to be able to search for any publicly traded company by ticker symbol or company name, so that I can view the dashboard's financial analysis for different companies without needing separate dashboards.

## Proposed Implementation

### UI Components
1. **Search Interface**
   - Text input modal/dialog at the top of the dashboard
   - Alternative: Hamburger menu (☰) with search functionality
   - Placeholder text: "Enter ticker symbol or company name"

2. **Auto-Complete Functionality**
   - Dynamic pick list that updates as user types
   - Display both ticker symbols and company names in results
   - Show exchange information (NYSE, NASDAQ, etc.)
   - Responsive API calls for real-time search results

### Technical Requirements

#### Search API Integration
- Implement stock ticker/company name search API endpoint
- Options to consider:
  - Yahoo Finance search API (already in use)
  - Alpha Vantage symbol search
  - IEX Cloud search endpoint
  - Polygon.io ticker search
- Debounce search input to avoid excessive API calls
- Cache recent searches for performance

#### Data Flow
1. User types in search box
2. Debounced API call fetches matching tickers/companies
3. Display auto-complete dropdown with results
4. User selects company
5. Dashboard refreshes with new ticker data
6. Store selected ticker in localStorage for persistence

### Market Intelligence Adaptation

**Challenge**: Market indicators/tiles at bottom of dashboard are currently COHR-specific (e.g., AI Datacom, Networking segments)

**Proposed Solution**:
1. **Dynamic Tile Generation via LLM Analysis**
   - Fetch recent 10-K and 10-Q reports for selected company
   - Send reports to LLM API (e.g., Gemini-2.0-flash, GPT-4)
   - Extract relevant business segments and key metrics
   - Dynamically generate appropriate dashboard tiles

2. **Tile Configuration Options**
   - Define set of possible tile types (Revenue by Segment, Geographic Revenue, Product Lines, etc.)
   - LLM determines which tiles are most relevant based on company's business model
   - Cache tile configurations per ticker to reduce API calls

3. **Fallback Strategy**
   - If LLM analysis unavailable, show generic tiles (Market Cap, P/E Ratio, Revenue Growth, etc.)
   - Allow manual tile configuration as future enhancement

## Implementation Phases

### Phase 1: Basic Search & Selection
- [ ] Implement search UI component
- [ ] Integrate ticker search API
- [ ] Add auto-complete functionality
- [ ] Update all API endpoints to use dynamic ticker
- [ ] Persist selected ticker in localStorage

### Phase 2: Dynamic Market Intelligence
- [ ] Implement SEC filing fetcher (10-K, 10-Q)
- [ ] Integrate LLM API for document analysis
- [ ] Create dynamic tile generation system
- [ ] Build tile template library
- [ ] Implement caching strategy

### Phase 3: Enhanced Features
- [ ] Recent searches history
- [ ] Favorite tickers list
- [ ] Compare multiple tickers
- [ ] Industry-specific tile templates

## API Endpoints to Modify

All existing endpoints need to accept dynamic ticker parameter:
- `/api/stock?symbol={TICKER}`
- `/api/news?symbol={TICKER}`
- `/api/analyst?symbol={TICKER}`
- `/api/technical?symbol={TICKER}`
- `/api/technical-real?symbol={TICKER}`
- `/api/historical?symbol={TICKER}`

New endpoints needed:
- `/api/search?query={QUERY}` - Ticker/company search
- `/api/company-profile?symbol={TICKER}` - Company details
- `/api/sec-filings?symbol={TICKER}` - Fetch recent filings
- `/api/analyze-segments?symbol={TICKER}` - LLM analysis endpoint

## UI/UX Considerations

- Smooth transition when switching between companies
- Loading states during data fetching
- Error handling for invalid tickers
- Mobile-responsive search interface
- Keyboard navigation for search results

## Security & Performance

- Rate limiting on search API
- Sanitize user input to prevent injection
- Cache search results and company data
- Implement request debouncing (300ms suggested)
- Consider CDN for static company logos

## Dependencies

- Stock ticker search API service
- LLM API service (for market intelligence)
- SEC EDGAR API or data provider
- Additional npm packages for debouncing, caching

## Success Criteria

- Users can search for any publicly traded company
- Auto-complete provides relevant results within 300ms
- Dashboard updates completely with new ticker data
- Market intelligence tiles adapt to company's business model
- No degradation in current dashboard performance

## Priority

**Medium Priority** - This feature significantly enhances the dashboard's utility but current COHR-focused functionality remains valuable.

## Estimated Effort

- Phase 1: 2-3 days
- Phase 2: 3-5 days
- Phase 3: 2-3 days

Total: ~10 days of development

## Related Issues

- Could enable future multi-company comparison features
- Prerequisite for portfolio dashboard view
- Enhances potential for white-label deployment

## Questions for Discussion

1. Should we limit to US exchanges initially or support international markets?
2. How many recent searches should we store?
3. Should tile configurations be user-customizable or fully automated?
4. What's the preferred LLM service for SEC filing analysis?
5. Should we implement watchlist functionality in Phase 1 or later?

---

**Labels**: enhancement, medium-priority, feature-request  
**Milestone**: Future Enhancements  
**Project**: COHR Dashboard Evolution