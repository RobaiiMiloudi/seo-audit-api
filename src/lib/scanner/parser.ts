// src/lib/scanner/parser.ts
import * as cheerio from 'cheerio';
import { chromium } from 'playwright';
import { ScrapeResult, ContentStructureReport, ImageReport, LinkReport, SocialReport } from '../../types';

// Import our specialist extractors!
import { getMetaData } from './extractMetaData';
import { getContentStructure } from './extractContent';
import { getImages } from './extractImages';
import { getLinks } from './extractLinks';
import { getSocialData } from './extractSocial';
import { getTechnicalData } from './extractTechnical';


// --- HELPER: A blank structure to return when the scraper completely fails ---
const getEmptyContentStructure = (): ContentStructureReport => ({
  h1: { values:[], isMissing: true, isMultiple: false },
  headings: { items:[], hasSkippedLevel: false },
  wordCount: { count: 0, isThinContent: true },
  language: { value: "", isMissing: true }
});

const getEmptyImageReport = (): ImageReport => ({ // <--- 2. Empty Image helper
  totalImages: 0,
  missingAltCount: 0,
  notLazyCount: 0,
  details:[]
});

const getEmptyLinkReport = (): LinkReport => ({
  totalLinks: 0,
  internalCount: 0,
  externalCount: 0,
  genericAnchorCount: 0,
  nofollowCount: 0,
  details: []
});

const getEmptySocialReport = (): SocialReport => ({
  openGraph: { title: "", description: "", image: "", isMissing: true, hasImage: false },
  twitter:   { card: "", title: "", description: "", image: "", isMissing: true },
  schema:    { detected: false, types: [], count: 0 },
});

const getEmptyTechnicalReport = (): any => ({
  security: { isHttps: false },
  mobile: { hasViewport: false, viewportContent: "" },
  branding: { hasFavicon: false, faviconUrl: "" },
});

// 1. Static Scraper (Fast)
export async function scrapeWithCheerio(url: string): Promise<ScrapeResult> {
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'SEO-Audit-Bot/1.0' } });
    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
    
    const html = await response.text();
    const metaReport = getMetaData(html, url);
    const contentReport = getContentStructure(html);
    const imageReport = getImages(html);
    const linkReport = getLinks(html, url);
    const socialReport = getSocialData(html);
    const technicalReport = getTechnicalData(html, url);
    


    return { meta: metaReport, content: contentReport, images: imageReport, links: linkReport, social: socialReport, technical: technicalReport };
  } catch (error: any) {
    return { 
      meta: getMetaData("", url), 
      content: getEmptyContentStructure(), 
      images: getEmptyImageReport(),
      links: getEmptyLinkReport(),
      social: getEmptySocialReport(),
      technical: getEmptyTechnicalReport(),
      error: "Failed to extract page data. The page may be using an unsupported format or heavy obfuscation." 
    };
  }
}

// 2. Dynamic Scraper (Slow but Accurate)
export async function scrapeWithPlaywright(url: string): Promise<ScrapeResult> {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    const html = await page.content();
    const finalUrl = page.url(); 

    const metaReport = getMetaData(html, finalUrl);
    const contentReport = getContentStructure(html);
    const imageReport = getImages(html);
    const linkReport = getLinks(html, finalUrl);
    const socialReport = getSocialData(html);
    const technicalReport = getTechnicalData(html, finalUrl);



    await browser.close();
    
    return { meta: metaReport, content: contentReport, images: imageReport, links: linkReport, social: socialReport, technical: technicalReport };
  } catch (error: any) {
    if (browser) await browser.close();
    return { 
      meta: getMetaData("", url), 
      content: getEmptyContentStructure(), 
      images: getEmptyImageReport(),
      links: getEmptyLinkReport(),
      social: getEmptySocialReport(),
      technical: getEmptyTechnicalReport(),
      error: "Failed to extract page data. The page may be using an unsupported format or heavy obfuscation." 
    };
  }
}

// 3. THE MASTER FUNCTION
export async function hybridScrape(url: string): Promise<ScrapeResult> {
    console.log(`[Scraper] Attempting fast static scrape for: ${url}`);
    const staticResult = await scrapeWithCheerio(url);

    // If Cheerio missed the H1, use Playwright
    if (staticResult.content.h1.isMissing && !staticResult.error) {
        console.log(`[Scraper] No H1 found. Fallback to Playwright (Dynamic) for: ${url}`);
        return await scrapeWithPlaywright(url);
    }

    console.log(`[Scraper] Static scrape successful!`);
    return staticResult;
}