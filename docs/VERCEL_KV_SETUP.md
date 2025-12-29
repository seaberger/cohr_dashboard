# Vercel KV (Redis) Setup Guide

This guide explains how to set up Vercel KV for the real sparklines feature.

## Overview

Vercel KV is a serverless Redis database that comes built-in with your Vercel account. It's used to cache historical metrics data extracted from SEC 10-Q filings, enabling real sparkline visualizations.

## Pricing

| Tier | Commands/Day | Storage | Cost |
|------|--------------|---------|------|
| Hobby (Free) | 3,000 | 256 MB | $0 |
| Pro | 150,000 | 1 GB | Included with Pro |
| Enterprise | Custom | Custom | Custom |

For the COHR Dashboard, the free tier is sufficient since historical data is cached permanently and only queried when users load the page.

## Setup Steps

### 1. Create a KV Database

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (cohr_dashboard)
3. Navigate to the **Storage** tab
4. Click **Create Database**
5. Select **KV** (Redis)
6. Choose a name (e.g., `cohr-metrics-cache`)
7. Select your region (choose closest to your users)
8. Click **Create**

### 2. Connect to Your Project

After creating the database:
1. Click **Connect Project**
2. Select your `cohr_dashboard` project
3. Vercel will automatically add these environment variables:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`
   - `KV_URL`

### 3. Redeploy Your Project

After connecting the database, trigger a new deployment:
```bash
# Push any change to trigger auto-deploy
git push origin feature/real-sparklines

# Or manually redeploy from Vercel dashboard
```

### 4. Run the Historical Backfill

Once deployed, run the backfill script to populate historical data:

```bash
# Set environment variables for local execution
export GEMINI_API_KEY="your-gemini-api-key"
export KV_REST_API_URL="your-kv-rest-api-url"
export KV_REST_API_TOKEN="your-kv-rest-api-token"

# Run the backfill script
node scripts/backfill-historical-metrics.js --symbol COHR --quarters 8
```

Or run with dry-run first to see what would be extracted:
```bash
node scripts/backfill-historical-metrics.js --dry-run
```

## Local Development

For local development, you need to set up environment variables:

### Option 1: Vercel CLI (Recommended)

```bash
# Link your local project to Vercel
vercel link

# Pull environment variables
vercel env pull .env.local
```

### Option 2: Manual Setup

Copy the environment variables from Vercel dashboard to your `.env.local`:

```env
KV_REST_API_URL=your-url-here
KV_REST_API_TOKEN=your-token-here
KV_REST_API_READ_ONLY_TOKEN=your-read-only-token-here
KV_URL=your-url-here
GEMINI_API_KEY=your-gemini-key-here
```

## Verifying the Setup

### Check Cache Status

After backfill, verify data was cached by visiting:
```
https://your-domain.vercel.app/api/sparkline-data?symbol=COHR
```

Expected response:
```json
{
  "status": "success",
  "symbol": "COHR",
  "quartersAvailable": 8,
  "quarters": ["2023-Q1", "2023-Q2", ...],
  "sparklines": {
    "revenue": {
      "data": [1200, 1350, 1400, ...],
      "trend": "positive",
      "count": 8
    },
    ...
  }
}
```

### Check Individual Metrics

The sparklines should appear on the dashboard after:
1. Vercel KV is set up
2. Backfill script has run
3. Page is refreshed

## Cost Estimation

For a single-ticker dashboard like COHR:

| Operation | Frequency | Commands/Day |
|-----------|-----------|--------------|
| Page loads (sparkline fetch) | ~100 views | ~100 |
| Backfill (one-time) | Once | ~20 |
| Current quarter update | 4x/year | ~1 |

**Total: ~100 commands/day** (well within free tier)

## Troubleshooting

### "Cache service unavailable" Error

This means the KV environment variables are not set:
1. Check Vercel dashboard → Storage → KV
2. Ensure the database is connected to your project
3. Redeploy your project

### "No historical data" Error

This means the backfill script hasn't been run:
1. Run `node scripts/backfill-historical-metrics.js`
2. Check for errors in the output
3. Verify data with `/api/sparkline-data`

### Sparklines Not Showing

1. Check browser console for errors
2. Verify `/api/sparkline-data` returns data
3. Ensure canvas elements are visible in DOM

## Data Schema

Historical data is stored with these keys:

```
cohr:metrics:2024-Q1  # Historical quarter data (permanent)
cohr:metrics:2024-Q2
cohr:metrics:current   # Current quarter (6-hour TTL)
```

Each entry contains:
```json
{
  "quarterYear": "Q1 2024",
  "filingDate": "2024-05-01",
  "metrics": {
    "revenue": { "value": 1234, "unit": "millions", "display": "$1,234M" },
    "grossMarginPct": { "value": 35.0, "unit": "percent", "display": "35.0%" },
    ...
  },
  "model": "gemini-3-flash-preview",
  "cachedAt": "2024-06-01T10:30:00Z"
}
```

## Security Notes

- Environment variables are securely managed by Vercel
- Read-only tokens are available for client-side use if needed
- All data is encrypted in transit and at rest
