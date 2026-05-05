import { hybridScrape } from '../../lib/scanner/parser.js';
import { checkReachability } from '../../lib/scanner/reachability.js';
import type { ScrapeResult } from './scraper.types.js';

export async function scrapePage(targetUrl: string): Promise<ScrapeResult> {
  const reachability = await checkReachability(targetUrl);
  if (!reachability.isReachable) {
    throw new Error(reachability.errorMessage || 'Target URL is unreachable.');
  }

  return await hybridScrape(targetUrl);
}
