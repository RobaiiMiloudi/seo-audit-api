// src/lib/scanner/extractTechnical.ts
import * as cheerio from 'cheerio';
import { TechnicalReport } from '../../types';

export function getTechnicalData(html: string, url: string): TechnicalReport {
  const $ = cheerio.load(html);

  // --- 1. Viewport (Mobile Readiness) ---
  const viewportContent = $('meta[name="viewport"]').attr('content') || "";
  
  // --- 2. Favicon (Branding & UX) ---
  // Look for various common favicon link relationships
  const favicon = $('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]').attr('href') || "";

  return {
    security: {
      isHttps: url.startsWith('https://'),
    },
    mobile: {
      hasViewport: viewportContent.length > 0,
      viewportContent: viewportContent,
    },
    branding: {
      hasFavicon: favicon.length > 0,
      faviconUrl: favicon,
    }
  };
}
