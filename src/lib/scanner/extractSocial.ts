// src/lib/scanner/extractSocial.ts
import * as cheerio from 'cheerio';
import { SocialReport } from '../../types';

export function getSocialData(html: string): SocialReport {
  const $ = cheerio.load(html);

  // --- Extract Open Graph ---
  const ogTitle = $('meta[property="og:title"]').attr('content') || "";
  const ogDesc  = $('meta[property="og:description"]').attr('content') || "";
  const ogImg   = $('meta[property="og:image"]').attr('content') || "";

  // --- Extract Twitter Cards ---
  const twCard  = $('meta[name="twitter:card"]').attr('content') || "";
  const twTitle = $('meta[name="twitter:title"]').attr('content') || "";
  const twDesc  = $('meta[name="twitter:description"]').attr('content') || "";
  const twImg   = $('meta[name="twitter:image"]').attr('content') || "";

  // --- Extract Schema.org (JSON-LD) ---
  const schemaTypes: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || "{}");
      const extractType = (obj: any) => {
        if (obj['@type']) schemaTypes.push(obj['@type']);
        if (obj['@graph'] && Array.isArray(obj['@graph'])) {
          obj['@graph'].forEach((item: any) => extractType(item));
        }
      };
      extractType(json);
    } catch {
      // Ignore malformed JSON-LD blocks
    }
  });

  return {
    openGraph: {
      title:     ogTitle,
      description: ogDesc,
      image:     ogImg,
      isMissing: !ogTitle && !ogDesc,
      hasImage:  !!ogImg,
    },
    twitter: {
      card:        twCard,
      title:       twTitle,
      description: twDesc,
      image:       twImg,
      isMissing:   !twCard && !twTitle,
    },
    schema: {
      detected: schemaTypes.length > 0,
      types:    [...new Set(schemaTypes)],
      count:    schemaTypes.length,
    },
  };
}
