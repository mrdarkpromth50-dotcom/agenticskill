import axios from 'axios';
import * as cheerio from 'cheerio';
import { TrendItem, Proposal } from './types';

const MEMORY_SYSTEM_URL = process.env.MEMORY_SYSTEM_URL || 'http://localhost:3001';
const DISCORD_BOT_URL = process.env.DISCORD_BOT_URL || 'http://localhost:3014';
const DISCORD_CHANNEL_TREND = process.env.DISCORD_CHANNEL_TREND_RESEARCH || '';

// User-Agent to avoid being blocked
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const REQUEST_TIMEOUT = 15000;

interface ScrapedArticle {
  title: string;
  url: string;
  source: string;
  category: string;
  snippet?: string;
  publishedAt?: string;
}

export class TrendResearchEngine {
  private llmCall: (prompt: string, model?: string) => Promise<string>;

  constructor(llmCall: (prompt: string, model?: string) => Promise<string>) {
    this.llmCall = llmCall;
  }

  /**
   * Scrape trends from multiple real news sources without relying on external APIs
   */
  public async searchTrends(): Promise<TrendItem[]> {
    console.log('[TrendResearchEngine] Starting web scraping for trends...');

    const allArticles: ScrapedArticle[] = [];

    // Scrape from multiple sources in parallel
    const scrapers = [
      this.scrapeHackerNews(),
      this.scrapeTechCrunchRSS(),
      this.scrapeTheVerge(),
      this.scrapeArsTechnica(),
      this.scrapeRedditTech(),
      this.scrapeBBCTech(),
      this.scrapeThaiTech(),
    ];

    const results = await Promise.allSettled(scrapers);
    for (const result of results) {
      if (result.status === 'fulfilled') {
        allArticles.push(...result.value);
      } else {
        console.warn('[TrendResearchEngine] Scraper failed:', result.reason?.message || 'Unknown error');
      }
    }

    console.log(`[TrendResearchEngine] Scraped ${allArticles.length} articles from ${scrapers.length} sources`);

    // Convert scraped articles to TrendItems
    const trends = this.articlesToTrends(allArticles);
    console.log(`[TrendResearchEngine] Identified ${trends.length} trends`);

    // Send to Discord if configured
    await this.sendTrendsToDiscord(trends);

    return trends;
  }

  /**
   * Scrape Hacker News front page
   */
  private async scrapeHackerNews(): Promise<ScrapedArticle[]> {
    const articles: ScrapedArticle[] = [];
    try {
      const response = await axios.get('https://news.ycombinator.com/', {
        headers: { 'User-Agent': USER_AGENT },
        timeout: REQUEST_TIMEOUT,
      });
      const $ = cheerio.load(response.data);

      $('.titleline > a').each((i, el) => {
        if (i >= 15) return false; // Top 15
        const title = $(el).text().trim();
        const url = $(el).attr('href') || '';
        if (title && url) {
          articles.push({
            title,
            url: url.startsWith('http') ? url : `https://news.ycombinator.com/${url}`,
            source: 'Hacker News',
            category: 'tech',
          });
        }
      });
      console.log(`[TrendResearchEngine] HackerNews: ${articles.length} articles`);
    } catch (error: any) {
      console.error('[TrendResearchEngine] HackerNews scrape failed:', error.message);
    }
    return articles;
  }

  /**
   * Scrape TechCrunch RSS feed
   */
  private async scrapeTechCrunchRSS(): Promise<ScrapedArticle[]> {
    const articles: ScrapedArticle[] = [];
    try {
      const response = await axios.get('https://techcrunch.com/feed/', {
        headers: { 'User-Agent': USER_AGENT },
        timeout: REQUEST_TIMEOUT,
      });
      const $ = cheerio.load(response.data, { xmlMode: true });

      $('item').each((i, el) => {
        if (i >= 10) return false;
        const title = $(el).find('title').text().trim();
        const url = $(el).find('link').text().trim();
        const description = $(el).find('description').text().trim();
        const pubDate = $(el).find('pubDate').text().trim();

        if (title) {
          articles.push({
            title,
            url,
            source: 'TechCrunch',
            category: 'tech/startup',
            snippet: description.replace(/<[^>]*>/g, '').substring(0, 200),
            publishedAt: pubDate,
          });
        }
      });
      console.log(`[TrendResearchEngine] TechCrunch: ${articles.length} articles`);
    } catch (error: any) {
      console.error('[TrendResearchEngine] TechCrunch scrape failed:', error.message);
    }
    return articles;
  }

  /**
   * Scrape The Verge
   */
  private async scrapeTheVerge(): Promise<ScrapedArticle[]> {
    const articles: ScrapedArticle[] = [];
    try {
      const response = await axios.get('https://www.theverge.com/rss/index.xml', {
        headers: { 'User-Agent': USER_AGENT },
        timeout: REQUEST_TIMEOUT,
      });
      const $ = cheerio.load(response.data, { xmlMode: true });

      $('entry').each((i, el) => {
        if (i >= 10) return false;
        const title = $(el).find('title').text().trim();
        const url = $(el).find('link').attr('href') || $(el).find('id').text().trim();
        const summary = $(el).find('summary, content').text().trim();
        const published = $(el).find('published').text().trim();

        if (title) {
          articles.push({
            title,
            url,
            source: 'The Verge',
            category: 'tech',
            snippet: summary.replace(/<[^>]*>/g, '').substring(0, 200),
            publishedAt: published,
          });
        }
      });
      console.log(`[TrendResearchEngine] TheVerge: ${articles.length} articles`);
    } catch (error: any) {
      console.error('[TrendResearchEngine] TheVerge scrape failed:', error.message);
    }
    return articles;
  }

  /**
   * Scrape Ars Technica RSS
   */
  private async scrapeArsTechnica(): Promise<ScrapedArticle[]> {
    const articles: ScrapedArticle[] = [];
    try {
      const response = await axios.get('https://feeds.arstechnica.com/arstechnica/index', {
        headers: { 'User-Agent': USER_AGENT },
        timeout: REQUEST_TIMEOUT,
      });
      const $ = cheerio.load(response.data, { xmlMode: true });

      $('item').each((i, el) => {
        if (i >= 10) return false;
        const title = $(el).find('title').text().trim();
        const url = $(el).find('link').text().trim();
        const description = $(el).find('description').text().trim();

        if (title) {
          articles.push({
            title,
            url,
            source: 'Ars Technica',
            category: 'tech/science',
            snippet: description.replace(/<[^>]*>/g, '').substring(0, 200),
          });
        }
      });
      console.log(`[TrendResearchEngine] ArsTechnica: ${articles.length} articles`);
    } catch (error: any) {
      console.error('[TrendResearchEngine] ArsTechnica scrape failed:', error.message);
    }
    return articles;
  }

  /**
   * Scrape Reddit r/technology and r/artificial
   */
  private async scrapeRedditTech(): Promise<ScrapedArticle[]> {
    const articles: ScrapedArticle[] = [];
    const subreddits = ['technology', 'artificial', 'MachineLearning'];

    for (const sub of subreddits) {
      try {
        const response = await axios.get(`https://www.reddit.com/r/${sub}/hot.json?limit=10`, {
          headers: { 'User-Agent': USER_AGENT },
          timeout: REQUEST_TIMEOUT,
        });
        const posts = response.data?.data?.children || [];
        for (const post of posts.slice(0, 5)) {
          const data = post.data;
          if (data.title && !data.stickied) {
            articles.push({
              title: data.title,
              url: data.url || `https://reddit.com${data.permalink}`,
              source: `Reddit r/${sub}`,
              category: 'tech/ai',
              snippet: (data.selftext || '').substring(0, 200),
            });
          }
        }
      } catch (error: any) {
        console.error(`[TrendResearchEngine] Reddit r/${sub} scrape failed:`, error.message);
      }
    }
    console.log(`[TrendResearchEngine] Reddit: ${articles.length} articles`);
    return articles;
  }

  /**
   * Scrape BBC Technology
   */
  private async scrapeBBCTech(): Promise<ScrapedArticle[]> {
    const articles: ScrapedArticle[] = [];
    try {
      const response = await axios.get('https://feeds.bbci.co.uk/news/technology/rss.xml', {
        headers: { 'User-Agent': USER_AGENT },
        timeout: REQUEST_TIMEOUT,
      });
      const $ = cheerio.load(response.data, { xmlMode: true });

      $('item').each((i, el) => {
        if (i >= 10) return false;
        const title = $(el).find('title').text().trim();
        const url = $(el).find('link').text().trim();
        const description = $(el).find('description').text().trim();
        const pubDate = $(el).find('pubDate').text().trim();

        if (title) {
          articles.push({
            title,
            url,
            source: 'BBC Technology',
            category: 'tech/news',
            snippet: description.substring(0, 200),
            publishedAt: pubDate,
          });
        }
      });
      console.log(`[TrendResearchEngine] BBC: ${articles.length} articles`);
    } catch (error: any) {
      console.error('[TrendResearchEngine] BBC scrape failed:', error.message);
    }
    return articles;
  }

  /**
   * Scrape Thai tech news (Blognone)
   */
  private async scrapeThaiTech(): Promise<ScrapedArticle[]> {
    const articles: ScrapedArticle[] = [];
    try {
      const response = await axios.get('https://www.blognone.com/rss.xml', {
        headers: { 'User-Agent': USER_AGENT },
        timeout: REQUEST_TIMEOUT,
      });
      const $ = cheerio.load(response.data, { xmlMode: true });

      $('item').each((i, el) => {
        if (i >= 10) return false;
        const title = $(el).find('title').text().trim();
        const url = $(el).find('link').text().trim();
        const description = $(el).find('description').text().trim();

        if (title) {
          articles.push({
            title,
            url,
            source: 'Blognone (TH)',
            category: 'tech/thai',
            snippet: description.replace(/<[^>]*>/g, '').substring(0, 200),
          });
        }
      });
      console.log(`[TrendResearchEngine] Blognone: ${articles.length} articles`);
    } catch (error: any) {
      console.error('[TrendResearchEngine] Blognone scrape failed:', error.message);
    }
    return articles;
  }

  /**
   * Convert scraped articles into categorized TrendItems
   */
  private articlesToTrends(articles: ScrapedArticle[]): TrendItem[] {
    // Group articles by keywords/themes
    const categories: Record<string, ScrapedArticle[]> = {};

    const keywords: Record<string, string[]> = {
      'AI & Machine Learning': ['ai', 'artificial intelligence', 'machine learning', 'llm', 'gpt', 'claude', 'gemini', 'neural', 'deep learning', 'transformer', 'chatbot', 'generative'],
      'Cybersecurity': ['security', 'hack', 'breach', 'vulnerability', 'ransomware', 'cyber', 'privacy', 'encryption'],
      'Cloud & Infrastructure': ['cloud', 'aws', 'azure', 'google cloud', 'kubernetes', 'docker', 'serverless', 'infrastructure'],
      'Startup & Business': ['startup', 'funding', 'ipo', 'acquisition', 'venture', 'billion', 'valuation', 'series'],
      'Hardware & Devices': ['chip', 'processor', 'gpu', 'nvidia', 'apple', 'samsung', 'hardware', 'quantum'],
      'Software Development': ['developer', 'programming', 'open source', 'github', 'framework', 'language', 'rust', 'typescript'],
      'Blockchain & Crypto': ['crypto', 'bitcoin', 'ethereum', 'blockchain', 'web3', 'defi', 'nft', 'token'],
      'General Tech': [],
    };

    for (const article of articles) {
      const titleLower = (article.title + ' ' + (article.snippet || '')).toLowerCase();
      let matched = false;

      for (const [category, kws] of Object.entries(keywords)) {
        if (category === 'General Tech') continue;
        if (kws.some(kw => titleLower.includes(kw))) {
          if (!categories[category]) categories[category] = [];
          categories[category].push(article);
          matched = true;
          break;
        }
      }

      if (!matched) {
        if (!categories['General Tech']) categories['General Tech'] = [];
        categories['General Tech'].push(article);
      }
    }

    // Create TrendItems from categories
    const trends: TrendItem[] = [];
    for (const [category, catArticles] of Object.entries(categories)) {
      if (catArticles.length === 0) continue;

      const topArticles = catArticles.slice(0, 5);
      const summary = topArticles.map(a => `- ${a.title} (${a.source})`).join('\n');
      const implications = topArticles
        .filter(a => a.snippet)
        .map(a => a.snippet)
        .slice(0, 2)
        .join(' | ');

      trends.push({
        title: `${category} Trends (${catArticles.length} articles)`,
        summary,
        implications: implications || `${catArticles.length} articles found in ${category} category from multiple sources.`,
      });
    }

    return trends;
  }

  /**
   * Send trend results to Discord channel
   */
  private async sendTrendsToDiscord(trends: TrendItem[]): Promise<void> {
    if (!DISCORD_CHANNEL_TREND) return;

    try {
      const fields = trends.slice(0, 8).map(t => ({
        name: t.title,
        value: t.summary.substring(0, 1024),
        inline: false,
      }));

      await axios.post(`${DISCORD_BOT_URL}/trend`, {
        embed: {
          title: '📊 CEO Trend Research Report',
          description: `Scraped ${trends.length} trend categories from real news sources at ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}`,
          color: 0xe67e22,
          fields,
        },
      }, { timeout: 5000 });

      console.log('[TrendResearchEngine] Sent trends to Discord');
    } catch (error: any) {
      console.error('[TrendResearchEngine] Failed to send trends to Discord:', error.message);
    }
  }

  public async analyzeTrend(trend: TrendItem): Promise<{ relevance: number; impact: 'low' | 'medium' | 'high' }> {
    console.log(`[TrendResearchEngine] Analyzing trend: ${trend.title}`);

    // Simple rule-based analysis without LLM dependency
    const titleLower = trend.title.toLowerCase();
    let relevance = 50;
    let impact: 'low' | 'medium' | 'high' = 'medium';

    // AI-related trends are highly relevant
    if (titleLower.includes('ai') || titleLower.includes('machine learning')) {
      relevance = 85;
      impact = 'high';
    } else if (titleLower.includes('security') || titleLower.includes('cloud')) {
      relevance = 70;
      impact = 'medium';
    } else if (titleLower.includes('startup') || titleLower.includes('business')) {
      relevance = 65;
      impact = 'medium';
    }

    // Boost by article count
    const articleCount = parseInt(trend.title.match(/\((\d+) articles\)/)?.[1] || '0');
    if (articleCount > 10) relevance = Math.min(relevance + 15, 100);
    else if (articleCount > 5) relevance = Math.min(relevance + 10, 100);

    console.log(`[TrendResearchEngine] Analysis: Relevance=${relevance}, Impact=${impact}`);
    return { relevance, impact };
  }

  public async createProposal(trend: TrendItem, analysis: { relevance: number; impact: 'low' | 'medium' | 'high' }): Promise<Proposal> {
    console.log(`[TrendResearchEngine] Creating proposal for: ${trend.title}`);

    const proposal: Proposal = {
      id: `proposal-${Date.now()}`,
      title: `Action Plan: ${trend.title}`,
      summary: `Based on ${trend.title}. Key findings:\n${trend.summary}`,
      impact: analysis.impact,
      actionItems: [
        `Monitor developments in ${trend.title.split(' Trends')[0]}`,
        'Evaluate potential integration opportunities',
        'Assess competitive landscape changes',
        'Prepare technical feasibility report',
      ],
      estimatedCost: analysis.impact === 'high' ? 'medium' : 'low',
      estimatedTime: analysis.impact === 'high' ? 'medium-term' : 'short-term',
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    return proposal;
  }

  public async saveToMemory(proposal: Proposal): Promise<void> {
    console.log(`[TrendResearchEngine] Saving proposal '${proposal.title}' to memory.`);
    try {
      await axios.post(`${MEMORY_SYSTEM_URL}/memory/long-term`, {
        agentId: 'ceo-agent',
        key: `proposal-${proposal.id}`,
        content: JSON.stringify(proposal),
        metadata: { type: 'proposal', title: proposal.title, impact: proposal.impact, createdAt: proposal.createdAt },
      });
    } catch (error: any) {
      console.error(`[TrendResearchEngine] Failed to save proposal:`, error.message);
    }
  }

  public async getStoredProposals(): Promise<Proposal[]> {
    try {
      const response = await axios.post(`${MEMORY_SYSTEM_URL}/memory/long-term/search`, {
        agentId: 'ceo-agent',
        query: 'all proposals',
        filter: { type: 'proposal' },
        topK: 100,
      });
      return (response.data.results || []).map((item: any) => JSON.parse(item.content));
    } catch (error: any) {
      console.error('[TrendResearchEngine] Failed to get proposals:', error.message);
      return [];
    }
  }
}
