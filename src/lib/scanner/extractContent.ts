// src/lib/scanner/extractContent.ts
import * as cheerio from 'cheerio';
import type { ContentStructureReport, HeadingItem } from '../../modules/scraper/index.js';

export function getContentStructure(html: string): ContentStructureReport {
  const $ = cheerio.load(html);

  // --- 1. H1 Extraction ---
  const h1s = $('h1').map((_, el) => $(el).text().trim()).get();
  
  // --- 2. All Headings & Hierarchy Check ---
  const allHeadings: HeadingItem[] =[];
  let hasSkippedLevel = false;
  let previousLevel = 0; // 0 means no heading encountered yet

  // Select all heading tags in the order they appear in the HTML
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    // el.tagName is like 'h2'. .replace('h', '') makes it '2'. parseInt makes it a real number.
    const level = parseInt(el.tagName.toLowerCase().replace('h', ''), 10);
    const text = $(el).text().trim();

    allHeadings.push({ level, text });

    // Hierarchy logic: If current level is more than 1 level deeper than previous
    // (e.g., going from H1 to H3 or H2 to H4)
    if (previousLevel !== 0 && level - previousLevel > 1) {
      hasSkippedLevel = true;
    }
    previousLevel = level;
  });

  // --- 3. Word Count Calculation ---
  // Clone the body to strip unwanted elements before counting text
  const bodyElement = $('body');
  
  // We remove elements that aren't "content"
  const textContent = bodyElement.clone();
  textContent.find('script, style, noscript, svg, nav, footer').remove();
  
  const cleanText = textContent.text().replace(/\s+/g, ' ').trim();
  const words = cleanText.split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;

  // --- 4. Language Attribute ---
  const lang = $('html').attr('lang')?.trim() || "";

  return {
    h1: {
      values: h1s,
      isMissing: h1s.length === 0,
      isMultiple: h1s.length > 1,
    },
    headings: {
      items: allHeadings,
      hasSkippedLevel, // True if the structure is broken!
    },
    wordCount: {
      count: wordCount,
      isThinContent: wordCount < 300,
    },
    language: {
      value: lang,
      isMissing: lang === "",
    }
  };
}
