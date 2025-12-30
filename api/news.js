// Vercel serverless function for news data with relevance scoring and SEC filings
import { getRecentBlogs } from '../lib/cacheService.js';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const symbol = req.query.symbol || process.env.DEFAULT_SYMBOL || 'COHR';
    const limit = parseInt(req.query.limit) || parseInt(process.env.MAX_NEWS_ARTICLES) || 10;
    // Default threshold filters out unrelated articles (oil, crypto, etc.)
    const minRelevance = parseInt(req.query.minRelevance) || 10;

    try {
      let newsData = [];

      // Fetch news from multiple sources in parallel
      // Note: Coherent's official press releases at coherent.com/news/press-releases
      // require JavaScript rendering - not accessible via simple fetch
      const [yahooNews, secFilings, bloombergNews, blogPosts] = await Promise.all([
        fetchYahooNews(symbol, limit),
        fetchSECFilingsAsNews(symbol),
        fetchBloombergNews(limit),
        fetchBlogsFromRedis(symbol)
      ]);

      // Combine all sources (SEC filings include official 8-K event announcements)
      newsData = [...yahooNews, ...secFilings, ...bloombergNews, ...blogPosts];

      // Calculate relevance scores for all articles
      newsData = newsData.map(article => ({
        ...article,
        relevanceScore: calculateRelevanceScore(article, symbol)
      }));

      // Filter by minimum relevance score
      newsData = newsData.filter(article => article.relevanceScore >= minRelevance);

      // Sort by relevance first, then by date
      newsData.sort((a, b) => {
        // SEC filings get priority boost
        if (a.type === 'sec-filing' && b.type !== 'sec-filing') return -1;
        if (b.type === 'sec-filing' && a.type !== 'sec-filing') return 1;

        // Then by relevance score
        if (b.relevanceScore !== a.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }

        // Then by date
        return new Date(b.publishedAt) - new Date(a.publishedAt);
      });

      // Deduplicate by title similarity
      newsData = deduplicateNews(newsData);

      const response = {
        articles: newsData.slice(0, limit),
        totalResults: newsData.length,
        symbol: symbol.toUpperCase(),
        lastUpdated: new Date().toISOString(),
        dataSources: ['Yahoo Finance', 'SEC EDGAR (8-K/10-Q/10-K)', 'Bloomberg Technology', 'Coherent Blog'],
        note: 'News filtered by relevance. SEC filings provide official company announcements.'
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('News API error:', error);
      res.status(500).json({
        error: 'Failed to fetch news data',
        message: error.message
      });
    }
}

/**
 * Calculate relevance score (0-100) for an article
 */
function calculateRelevanceScore(article, symbol) {
  let score = 0;
  const title = (article.title || '').toLowerCase();
  const desc = (article.description || '').toLowerCase();
  const source = (article.source?.name || '').toLowerCase();

  // SEC filings and official press releases are always highly relevant
  if (article.type === 'sec-filing') {
    return 95;
  }
  if (article.type === 'press-release') {
    return 90;
  }
  // Official Coherent blog posts are highly relevant
  if (article.type === 'blog') {
    return 85;
  }

  // Direct company mentions (highest weight)
  const companyTerms = ['coherent', 'cohr'];
  companyTerms.forEach(term => {
    if (title.includes(term)) score += 50;
    if (desc.includes(term)) score += 25;
  });

  // Industry-specific terms (Coherent's core business)
  const coreBusinessTerms = [
    'photonics', 'optical networking', 'transceiver', 'transceivers',
    '800g', '400g', '1.6t', 'silicon photonics', 'co-packaged optics',
    'datacenter optics', 'coherent optics', 'optical components',
    'vcsel', 'laser diode', 'indium phosphide'
  ];
  coreBusinessTerms.forEach(term => {
    if (title.includes(term)) score += 20;
    if (desc.includes(term)) score += 10;
  });

  // Related market terms
  const marketTerms = [
    'hyperscale', 'data center', 'datacenter', 'ai infrastructure',
    'optical fiber', 'networking equipment', 'cloud infrastructure'
  ];
  marketTerms.forEach(term => {
    if (title.includes(term)) score += 10;
    if (desc.includes(term)) score += 5;
  });

  // Competitor mentions (provides industry context)
  const competitors = ['lumentum', 'ii-vi', 'broadcom', 'ciena', 'infinera', 'marvell'];
  competitors.forEach(comp => {
    if (title.includes(comp)) score += 8;
    if (desc.includes(comp)) score += 4;
  });

  // General semiconductor/tech (low weight - too broad)
  if (title.includes('semiconductor') && !title.includes('coherent')) score += 5;
  if (title.includes('nvidia') && desc.includes('datacenter')) score += 5;

  // Penalize very generic tech news
  const genericTerms = ['apple', 'google', 'microsoft', 'meta', 'tesla', 'crypto', 'bitcoin'];
  genericTerms.forEach(term => {
    if (title.includes(term) && !desc.includes('coherent')) score -= 10;
  });

  return Math.max(0, Math.min(score, 100));
}

/**
 * Fetch news from Yahoo Finance Search API
 */
async function fetchYahooNews(symbol, limit) {
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${symbol}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    if (!data?.news?.length) return [];

    const articles = await Promise.all(
      data.news.slice(0, limit).map(async (item) => {
        let description = item.summary || '';

        // Try to fetch article summary if none provided
        if (!description && item.link?.includes('finance.yahoo.com')) {
          description = await fetchArticleSummary(item.link);
        }

        return {
          title: item.title,
          description: description || 'Click to read full article',
          url: item.link,
          publishedAt: new Date(item.providerPublishTime * 1000).toISOString(),
          source: { name: item.publisher },
          type: 'news',
          badge: '📰'
        };
      })
    );

    console.log(`Yahoo Finance: loaded ${articles.length} articles`);
    return articles;
  } catch (error) {
    console.log('Yahoo Finance news failed:', error.message);
    return [];
  }
}

/**
 * Fetch SEC filings and format as news items
 */
async function fetchSECFilingsAsNews(symbol) {
  const SEC_API_BASE = 'https://data.sec.gov';
  const USER_AGENT = 'COHR-Dashboard/1.0 (sean.bergman.dev@gmail.com)';

  // Known CIKs
  const knownCIKs = { 'COHR': '0000820318' };
  const cik = knownCIKs[symbol.toUpperCase()];

  if (!cik) return [];

  try {
    const response = await fetch(`${SEC_API_BASE}/submissions/CIK${cik}.json`, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) return [];

    const data = await response.json();
    const recentFilings = data.filings.recent;

    const newsItems = [];
    const filingTypes = ['10-Q', '10-K', '8-K', '8-K/A'];

    // Get recent filings (last 30 days for 8-K, last 90 days for 10-Q/10-K)
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now - 90 * 24 * 60 * 60 * 1000);

    for (let i = 0; i < Math.min(recentFilings.form.length, 50); i++) {
      const form = recentFilings.form[i];
      const filingDate = new Date(recentFilings.filingDate[i]);

      if (!filingTypes.includes(form)) continue;

      // Time filter
      if (form.startsWith('8-K') && filingDate < thirtyDaysAgo) continue;
      if ((form === '10-Q' || form === '10-K') && filingDate < ninetyDaysAgo) continue;

      const accessionNumber = recentFilings.accessionNumber[i];
      const cikForUrl = cik.replace(/^0+/, '');
      const accessionClean = accessionNumber.replace(/-/g, '');

      // Generate title and description based on filing type
      let title, description, badge;

      if (form === '10-Q') {
        title = `SEC Filing: Quarterly Report (Form 10-Q)`;
        description = `Coherent Corp filed its quarterly financial report with the SEC, including updated financial statements, MD&A, and risk factors.`;
        badge = '📋';
      } else if (form === '10-K') {
        title = `SEC Filing: Annual Report (Form 10-K)`;
        description = `Coherent Corp filed its annual financial report with comprehensive business overview, audited financials, and forward-looking statements.`;
        badge = '📋';
      } else if (form.startsWith('8-K')) {
        title = `SEC Filing: Current Report (Form 8-K)`;
        description = `Coherent Corp filed a current report disclosing a material event or corporate change.`;
        badge = '⚡';
      }

      newsItems.push({
        title,
        description,
        url: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=${form}&dateb=&owner=include&count=10`,
        publishedAt: filingDate.toISOString(),
        source: { name: 'SEC EDGAR' },
        type: 'sec-filing',
        filingType: form,
        badge,
        accessionNumber
      });

      // Limit SEC items
      if (newsItems.length >= 3) break;
    }

    console.log(`SEC EDGAR: loaded ${newsItems.length} filings as news`);
    return newsItems;
  } catch (error) {
    console.log('SEC filings fetch failed:', error.message);
    return [];
  }
}

/**
 * Fetch Bloomberg RSS for industry news
 */
async function fetchBloombergNews(limit) {
  try {
    const rssUrl = 'https://api.rss2json.com/v1/api.json?rss_url=https://feeds.bloomberg.com/markets/news.rss';
    const response = await fetch(rssUrl);
    const data = await response.json();

    if (!data.items?.length) return [];

    // Pre-filter Bloomberg for tech/semiconductor relevance before scoring
    const techKeywords = [
      'semiconductor', 'chip', 'nvidia', 'ai ', 'datacenter', 'data center',
      'cloud', 'tech', 'optical', 'photonics', 'networking', 'fiber',
      'transceiver', 'laser', 'hyperscale'
    ];

    const articles = data.items
      .filter(item => {
        const text = `${item.title} ${item.description || ''}`.toLowerCase();
        return techKeywords.some(kw => text.includes(kw));
      })
      .slice(0, limit)
      .map(item => ({
        title: item.title,
        description: cleanHtml(item.content || item.description || ''),
        url: item.link,
        publishedAt: item.pubDate,
        source: { name: 'Bloomberg' },
        type: 'news',
        badge: '📰'
      }));

    console.log(`Bloomberg RSS: loaded ${articles.length} relevant articles`);
    return articles;
  } catch (error) {
    console.log('Bloomberg RSS failed:', error.message);
    return [];
  }
}

/**
 * Fetch article summary from Yahoo Finance page
 */
async function fetchArticleSummary(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) return '';

    const html = await response.text();
    const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)/i);

    if (metaMatch?.[1]) {
      let desc = metaMatch[1].trim();
      if (desc.length > 250) desc = desc.substring(0, 250) + '...';
      return desc;
    }

    return '';
  } catch (error) {
    return '';
  }
}

/**
 * Clean HTML tags from text
 */
function cleanHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 250);
}

/**
 * Remove duplicate articles based on title similarity
 */
function deduplicateNews(articles) {
  const seen = new Set();
  return articles.filter(article => {
    // Normalize title for comparison
    const normalizedTitle = article.title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 50);

    if (seen.has(normalizedTitle)) {
      return false;
    }

    seen.add(normalizedTitle);
    return true;
  });
}

/**
 * Fetch Coherent blog posts from Redis cache
 */
async function fetchBlogsFromRedis(symbol) {
  try {
    const blogs = await getRecentBlogs(symbol.toLowerCase());
    if (!blogs?.length) {
      console.log('No cached blog posts found in Redis');
      return [];
    }

    // Blog posts already have the correct format from upload script
    // Just ensure they have publishedAt for sorting
    const articles = blogs.map(blog => ({
      ...blog,
      publishedAt: blog.parsedDate || new Date(0).toISOString()
    }));

    console.log(`Redis: loaded ${articles.length} blog posts`);
    return articles;
  } catch (error) {
    console.log('Blog fetch from Redis failed:', error.message);
    return [];
  }
}

// Note: Official Coherent press releases are at https://www.coherent.com/news/press-releases
// but require JavaScript rendering. SEC 8-K filings serve as official event announcements.
// Blog posts are fetched from Redis cache (populated by coherent_blog_scraper).
