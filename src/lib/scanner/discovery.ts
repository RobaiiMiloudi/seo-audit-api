// src/lib/scanner/discovery.ts

// @ts-ignore
import robotsParser from 'robots-parser';
import { XMLParser } from 'fast-xml-parser';

export async function checkDiscovery(targetUrl: string) {
  try {
    const urlObj = new URL(targetUrl);
    const origin = urlObj.origin; 
    const robotsUrl = `${origin}/robots.txt`;

    // Fetch robots.txt
    const robotsRes = await fetch(robotsUrl);
    const robotsText = robotsRes.ok ? await robotsRes.text() : '';
    
    // Use the PLURAL 'robotsParser'
    const robots = robotsParser(robotsUrl, robotsText);
    
    // Check if our bot is allowed
    const robotsAllowed = robots.isAllowed(targetUrl, 'SEO-Bot') ?? true;
    
    // Get sitemap link
    const sitemaps = robots.getSitemaps();
    const primarySitemap = sitemaps.length > 0 ? sitemaps[0] : `${origin}/sitemap.xml`;

    let isInSitemap = false;
    try {
      const sitemapRes = await fetch(primarySitemap);
      if (sitemapRes.ok) {
        const xmlData = await sitemapRes.text();
        const parser = new XMLParser();
        const jsonObj = parser.parse(xmlData);
        
        // Basic check for URL in sitemap
        const urls = jsonObj.urlset?.url;
        if (Array.isArray(urls)) {
          isInSitemap = urls.some((u: any) => u.loc === targetUrl);
        } else if (urls?.loc === targetUrl) {
          isInSitemap = true;
        }
      }
    } catch (e) {
      // If sitemap fails, we just continue
    }

    return {
      robotsAllowed,
      sitemapUrl: primarySitemap,
      isInSitemap,
    };
  } catch (error: any) {
    return {
      robotsAllowed: true,
      sitemapUrl: null,
      isInSitemap: false,
      error: error.message,
    };
  }
}