#!/usr/bin/env node
/**
 * Upload recent blog posts to Redis for the news API
 *
 * Reads from the coherent_blog_scraper outputs and uploads slim versions
 * to Redis for inclusion in the dashboard news feed.
 *
 * Usage:
 *   node scripts/upload-blogs-to-redis.js [--count 10] [--dry-run]
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from 'redis';
import fs from 'fs';
import path from 'path';

// Configuration
const BLOG_SCRAPER_PATH = path.join(process.env.HOME, 'Repositories/cohr_blog_scraping/outputs/coherent_blog_posts.json');
const REDIS_KEY = 'cohr:blogs:recent';

// Parse command line args
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const countIdx = args.indexOf('--count');
const count = countIdx !== -1 ? parseInt(args[countIdx + 1]) : 10;

/**
 * Parse various date formats from the blog scraper
 */
function parseDate(dateStr) {
  if (!dateStr) return new Date(0);

  // Try direct parse first
  const direct = new Date(dateStr);
  if (!isNaN(direct.getTime())) return direct;

  // Handle formats like "October 21, 2025" or "Sep 22, 2022"
  const months = {
    'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
    'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11,
    'january': 0, 'february': 1, 'march': 2, 'april': 3, 'june': 5,
    'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11
  };

  const match = dateStr.match(/(\w+)\s+(\d+),?\s+(\d{4})/i);
  if (match) {
    const month = months[match[1].toLowerCase()];
    const day = parseInt(match[2]);
    const year = parseInt(match[3]);
    if (month !== undefined) {
      return new Date(year, month, day);
    }
  }

  return new Date(0);
}

/**
 * Create a slim version of a blog post for the news feed
 */
function slimBlogPost(slug, post) {
  const description = (post.contentText || '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 250);

  return {
    slug,
    title: post.title || '',
    date: post.date || '',
    parsedDate: parseDate(post.date).toISOString(),
    description: description + (description.length >= 250 ? '...' : ''),
    url: `https://www.coherent.com/news/blog/${slug}`,
    source: { name: 'Coherent Blog' },
    type: 'blog',
    badge: '📝'
  };
}

async function main() {
  console.log('--- Upload Blogs to Redis ---');
  console.log(`Blog source: ${BLOG_SCRAPER_PATH}`);
  console.log(`Posts to upload: ${count}`);
  console.log(`Dry run: ${dryRun}`);
  console.log('');

  // Read blog posts
  if (!fs.existsSync(BLOG_SCRAPER_PATH)) {
    console.error(`ERROR: Blog posts file not found at ${BLOG_SCRAPER_PATH}`);
    console.error('Run the blog scraper first: cd ~/Repositories/cohr_blog_scraping && uv run python coherent_blog_scraper.py');
    process.exit(1);
  }

  const rawData = fs.readFileSync(BLOG_SCRAPER_PATH, 'utf-8');
  const allPosts = JSON.parse(rawData);

  console.log(`Loaded ${Object.keys(allPosts).length} total blog posts`);

  // Convert to array and sort by date (newest first)
  const postsArray = Object.entries(allPosts)
    .map(([slug, post]) => ({ slug, post, parsedDate: parseDate(post.date) }))
    .sort((a, b) => b.parsedDate - a.parsedDate);

  // Take the most recent N posts
  const recentPosts = postsArray.slice(0, count).map(({ slug, post }) => slimBlogPost(slug, post));

  console.log(`\nMost recent ${count} posts:`);
  recentPosts.forEach((post, i) => {
    console.log(`  ${i + 1}. ${post.date}: ${post.title.substring(0, 60)}...`);
  });

  // Calculate size
  const dataToStore = JSON.stringify(recentPosts);
  console.log(`\nData size: ${(dataToStore.length / 1024).toFixed(2)} KB`);

  if (dryRun) {
    console.log('\n[DRY RUN] Would store to Redis key:', REDIS_KEY);
    console.log('[DRY RUN] Sample data:', JSON.stringify(recentPosts[0], null, 2));
    return;
  }

  // Connect to Redis
  const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
  if (!redisUrl) {
    console.error('ERROR: REDIS_URL not configured. Set in .env.local');
    process.exit(1);
  }

  const redis = createClient({ url: redisUrl });
  redis.on('error', err => console.error('Redis error:', err));

  try {
    await redis.connect();
    console.log('\nConnected to Redis');

    // Store the blog posts
    await redis.set(REDIS_KEY, dataToStore);
    console.log(`Stored ${count} blog posts to Redis key: ${REDIS_KEY}`);

    // Verify
    const stored = await redis.get(REDIS_KEY);
    const verified = JSON.parse(stored);
    console.log(`Verified: ${verified.length} posts in Redis`);

  } finally {
    await redis.disconnect();
  }

  console.log('\nDone!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
