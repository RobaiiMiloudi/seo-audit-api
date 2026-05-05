import { config } from '../../config.js';
import type { PerformanceReport } from './performance.types.js';

export async function analyzePagePerformance(url: string): Promise<PerformanceReport | null> {
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
