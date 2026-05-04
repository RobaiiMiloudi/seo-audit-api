import { hybridScrape } from './parser';
import { checkReachability } from './reachability';
import { ScrapeResult, FullAuditReport, LighthouseReport, Suggestion } from '../../types';
import { config } from '../../config';
import crypto from 'crypto';

// 1. New function: Just do the HTML scraping
export async function performInitialScrape(targetUrl: string): Promise<ScrapeResult> {
  const reachability = await checkReachability(targetUrl);
  if (!reachability.isReachable) {
    throw new Error(reachability.errorMessage || 'Target URL is unreachable.');
  }
  return await hybridScrape(targetUrl);
}


// New Scoring & Suggestion Function
export function calculateScoreAndSuggestions(report: ScrapeResult, lighthouse: LighthouseReport | null): { score: number, suggestions: Suggestion[] } {
  let score = 100;
  const suggestions: Suggestion[] = [];

  // Helper to add issues
  const addIssue = (severity: Suggestion['severity'], category: Suggestion['category'], message: string, action: string, rationale: string, deduction: number) => {
    score -= deduction;
    suggestions.push({
      id: crypto.randomUUID(),
      severity,
      category,
      message,
      action,
      rationale,
      deduction
    });
  };

  // --- Meta Criticals & Warnings ---
  if (report.meta.title.isMissing) {
    addIssue('critical', 'meta', 'Title tag is missing.', 'Add a descriptive <title> tag (50-60 characters) to your page.', 'The title tag is the most important on-page SEO element. It tells search engines exactly what the page is about and is the first thing users see in search results.', 20);
  } else if (report.meta.title.isTooShort || report.meta.title.isTooLong) {
    addIssue('warning', 'meta', `Title length is ${report.meta.title.length} characters.`, 'Keep titles between 30 and 60 characters for best SEO.', 'Titles that are too short lack descriptive keywords, while titles that are too long get "cut off" (truncated) in Google search results, reducing click-through rates.', 5);
  }

  if (report.meta.description.isMissing) {
    addIssue('warning', 'meta', 'Meta description is missing.', 'Add a compelling <meta name="description"> tag.', 'While not a direct ranking factor, the description acts as "ad copy" in search results. A missing description means Google will pick random text from your site, which might not encourage users to click.', 10);
  }

  // --- Technical & Security ---
  if (!report.technical.security.isHttps) {
    addIssue('critical', 'technical', 'Site is not using HTTPS.', 'Install an SSL certificate to secure your site.', 'Security is a top priority for Google. Non-HTTPS sites are marked as "Not Secure" in browsers, which destroys user trust and negatively impacts rankings.', 20);
  }

  if (!report.technical.mobile.hasViewport) {
    addIssue('critical', 'technical', 'Missing Mobile Viewport tag.', 'Add <meta name="viewport" content="width=device-width, initial-scale=1">.', 'Without this tag, your site will look like a tiny "desktop" version on phones. Google uses mobile-first indexing, meaning they rank your site based on its mobile experience.', 15);
  }

  if (!report.technical.discovery?.sitemapUrl) {
    addIssue('warning', 'technical', 'No Sitemap detected.', 'Create an XML sitemap and submit it to Google Search Console.', 'A sitemap is a map for search engine bots. It helps them find and crawl all your important pages quickly, especially if your site is new or has a deep link structure.', 5);
  }

  if (!report.technical.discovery?.robotsAllowed) {
    addIssue('warning', 'technical', 'Robots.txt is blocking search engines.', 'Update robots.txt to allow crawling (User-agent: * Allow: /).', 'The robots.txt file is the "gatekeeper" of your site. If it is configured incorrectly, it can tell Google to ignore your entire website.', 5);
  }

  // --- Content ---
  if (report.content.h1.isMissing) {
    addIssue('critical', 'content', 'Missing H1 Tag.', 'Ensure the page has exactly one <h1> tag representing the main topic.', 'The H1 tag is the "Headline" of your page. It helps search engines understand the hierarchy of your content and confirms to users they are in the right place.', 15);
  } else if (report.content.h1.isMultiple) {
    addIssue('warning', 'content', `Found ${report.content.h1.values.length} H1 tags.`, 'Reduce to a single H1 tag to avoid confusing search engines.', 'Using multiple H1 tags can dilute the importance of your primary keyword and confuse search bots about what the most important topic of the page is.', 5);
  }

  // --- Images ---
  if (report.images.missingAltCount > 0) {
    const deduction = Math.min(report.images.missingAltCount * 2, 10);
    addIssue('minor', 'images', `Found ${report.images.missingAltCount} images missing ALT text.`, 'Add descriptive alt="..." attributes to improve accessibility and image SEO.', 'Alt text allows search engines to "read" what an image is about. It is also vital for accessibility, as screen readers use it to describe images to visually impaired users.', deduction);
  }

  // --- Lighthouse ---
  if (lighthouse) {
    if (lighthouse.performanceScore < 0.5) {
      addIssue('critical', 'performance', `Poor page speed (Score: ${Math.round(lighthouse.performanceScore * 100)}).`, 'Optimize images, minimize JavaScript, and use caching to improve load speed.', 'Slow sites frustrate users and lead to high bounce rates. Google explicitly uses Core Web Vitals as a ranking factor—speed directly equals better visibility.', 10);
    } else if (lighthouse.performanceScore < 0.8) {
      addIssue('warning', 'performance', `Mediocre page speed (Score: ${Math.round(lighthouse.performanceScore * 100)}).`, 'Review Lighthouse metrics like LCP and Speed Index to boost performance.', 'While your site is usable, there is significant room for optimization. Faster sites typically see higher conversion rates and better user engagement.', 5);
    }
  } else {
    addIssue('warning', 'technical', 'Lighthouse analysis failed.', 'No action required, but performance data is missing.', 'We were able to scrape the page, but performance metrics could not be retrieved.', 0);
  }

  return {
    score: Math.max(score, 0),
    suggestions
  };
}

// Fetch Lighthouse Data
export async function fetchLighthouseData(url: string): Promise<LighthouseReport | null> {
  const apiKey = config.PAGESPEED_API_KEY;
  console.log(`[Lighthouse] Starting fetch for: ${url} (Key present: ${!!apiKey})`);

  try {
    const keyParam = apiKey ? `&key=${apiKey}` : '';
    const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&category=performance&strategy=mobile${keyParam}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000);

    const response = await fetch(psiUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[Lighthouse] API failed with status ${response.status}:`, errorText);
      return null;
    }

    const data = await response.json();
    const lighthouse = data.lighthouseResult;

    if (!lighthouse) {
      console.warn('[Lighthouse] No lighthouseResult found in response data');
      return null;
    }

    console.log(`[Lighthouse] Successfully fetched data for: ${url}`);

    return {
      performanceScore: lighthouse.categories.performance?.score || 0,
      speedIndex: lighthouse.audits['speed-index']?.numericValue || 0,
      largestContentfulPaint: lighthouse.audits['largest-contentful-paint']?.numericValue || 0,
      totalBlockingTime: lighthouse.audits['total-blocking-time']?.numericValue || 0,
      cumulativeLayoutShift: lighthouse.audits['cumulative-layout-shift']?.numericValue || 0,
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error(`[Lighthouse] Timeout: API took too long for ${url}`);
    } else {
      console.error(`[Lighthouse] Error fetching data for ${url}:`, error.message);
    }
    return null;
  }
}

// The Master Scraper (Hybrid Approach)
export async function performFullAudit(targetUrl: string): Promise<FullAuditReport> {
  try {
    const reachability = await checkReachability(targetUrl);
    if (!reachability.isReachable) {
      throw new Error(reachability.errorMessage || 'Target URL is unreachable.');
    }

    const lighthousePromise = fetchLighthouseData(targetUrl);
    const rawData: ScrapeResult = await hybridScrape(targetUrl);

    if (rawData.error) {
      console.warn(`Scrape returned an error for ${targetUrl}:`, rawData.error);
    }

    const lighthouseData = await lighthousePromise;
    const { score: finalScore, suggestions } = calculateScoreAndSuggestions(rawData, lighthouseData);

    let grade = 'F';
    if (finalScore >= 90) grade = 'A';
    else if (finalScore >= 80) grade = 'B';
    else if (finalScore >= 70) grade = 'C';
    else if (finalScore >= 60) grade = 'D';

    return {
      url: targetUrl,
      score: finalScore,
      grade: grade,
      timestamp: new Date().toISOString(),
      data: rawData,
      lighthouse: lighthouseData || null,
      suggestions: suggestions
    };

  } catch (error: any) {
    throw new Error(`Audit failed: ${error.message}`);
  }
}
