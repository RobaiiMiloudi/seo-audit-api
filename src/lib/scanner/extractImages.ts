// src/lib/scanner/extractImages.ts
import * as cheerio from 'cheerio';
import type { ImageReport, ImageIssue } from '../../modules/scraper/index.js';

export function getImages(html: string): ImageReport {
  const $ = cheerio.load(html);
  const images: ImageIssue[] =[];
  
  let missingAltCount = 0;
  let notLazyCount = 0;

  $('img').each((_, el) => {
    const src = $(el).attr('src') || "";
    const alt = $(el).attr('alt') || "";
    const loading = $(el).attr('loading') || "";
    
    // Get filename: "https://site.com/images/shoe.jpg" -> "shoe.jpg"
    const fileName = src.split('/').pop() || "unknown";

    const isAltMissing = alt.trim() === "";
    const isLazy = loading === 'lazy';
    
    // Logic: If filename is mostly numbers or just "image", "img", "picture"
    const isFileNameGeneric = /^\d+$/.test(fileName.split('.')[0]) || 
                               ['image', 'img', 'picture', 'photo'].includes(fileName.split('.')[0].toLowerCase());

    if (isAltMissing) missingAltCount++;
    if (!isLazy) notLazyCount++;

    images.push({
      src,
      alt,
      fileName,
      isAltMissing,
      isLazy,
      isFileNameGeneric
    });
  });

  return {
    totalImages: images.length,
    missingAltCount,
    notLazyCount,
    details: images
  };
}
