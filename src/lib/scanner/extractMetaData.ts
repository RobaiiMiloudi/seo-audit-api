// src/lib/scanner/extractMetaData.ts
import * as cheerio from 'cheerio';
import { MetaDataReport } from '../../types';

export function getMetaData(html: string, currentUrl: string): MetaDataReport {
  const $ = cheerio.load(html);

  // Extract Title
  const titleText = $('title').text().trim();
  const titleLength = titleText.length;

  // Extract Description
  const descriptionText = $('meta[name="description"]').attr('content')?.trim() || "";
  const descriptionLength = descriptionText.length;

  // Extract Canonical
  const canonicalHref = $('link[rel="canonical"]').attr('href')?.trim() || "";
  const cleanCanonical = canonicalHref.replace(/\/$/, "");
  const cleanCurrentUrl = currentUrl.replace(/\/$/, "");

  // Extract Robots
  const robotsText = $('meta[name="robots"]').attr('content')?.toLowerCase().trim() || "";

  return {
    title: {
      value: titleText,
      length: titleLength,
      isMissing: titleLength === 0,
      isTooShort: titleLength > 0 && titleLength < 30,
      isTooLong: titleLength > 60,
    },
    description: {
      value: descriptionText,
      length: descriptionLength,
      isMissing: descriptionLength === 0,
      isTooLong: descriptionLength > 160,
    },
    canonical: {
      value: canonicalHref,
      isMissing: canonicalHref === "",
      matchesUrl: canonicalHref !== "" ? (cleanCanonical === cleanCurrentUrl) : false,
    },
    robots: {
      value: robotsText,
      isNoIndex: robotsText.includes("noindex"),
    }
  };
}