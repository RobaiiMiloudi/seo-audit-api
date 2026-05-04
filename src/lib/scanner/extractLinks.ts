import * as cheerio from 'cheerio';
import { LinkReport, LinkItem } from '../../types';

// ==========================================
// THE EXTRACTOR FUNCTION
// ==========================================

export function getLinks(html: string, baseUrl: string): LinkReport {
  const $ = cheerio.load(html);
  const links: LinkItem[] = [];
  
  // Normalize the base domain for comparison
  let host = "";
  try {
    host = new URL(baseUrl).hostname;
  } catch (e) {
    // If baseUrl is somehow invalid, we just use a blank string
  }

  let internalCount = 0;
  let externalCount = 0;
  let genericAnchorCount = 0;
  let nofollowCount = 0;

  const genericWords = ['click here', 'read more', 'link', 'more', 'view', 'here', 'go'];

  $('a').each((_, el) => {
    const href = $(el).attr('href') || "";
    const text = $(el).text().trim();
    const rel = $(el).attr('rel') || "";

    // Skip empty links, anchors (#), and phone/email links
    if (!href || href.startsWith('#') || href.startsWith('tel:') || href.startsWith('mailto:')) {
      return;
    }

    // --- Check if Internal or External ---
    let isInternal = false;
    try {
      if (href.startsWith('/') || href.startsWith('./') || href.startsWith('../')) {
        isInternal = true;
      } else {
        const linkHost = new URL(href, baseUrl).hostname;
        if (linkHost === host) isInternal = true;
      }
    } catch (e) {
      // If URL parsing fails, we assume it's a relative internal link
      isInternal = true;
    }

    // --- Check for Generic Anchor Text ---
    const isGenericAnchor = genericWords.includes(text.toLowerCase());
    
    // --- Check for Nofollow ---
    const isNofollow = rel.toLowerCase().includes('nofollow');

    // Increment counters
    if (isInternal) internalCount++; else externalCount++;
    if (isGenericAnchor) genericAnchorCount++;
    if (isNofollow) nofollowCount++;

    links.push({
      href,
      text: text || "[No Text]",
      isInternal,
      isNofollow,
      isGenericAnchor
    });
  });

  return {
    totalLinks: links.length,
    internalCount,
    externalCount,
    genericAnchorCount,
    nofollowCount,
    details: links
  };
}
