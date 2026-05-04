import { describe, it, expect } from 'vitest';
import { getTechnicalData } from './extractTechnical';

describe('Scanner: extractTechnical', () => {
  it('should detect technical features correctly', () => {
    const html = `
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="icon" href="/favicon.ico">
      </head>
      <body></body>
      </html>
    `;
    const result = getTechnicalData(html, 'https://example.com');

    expect(result.security.isHttps).toBe(true);
    expect(result.mobile.hasViewport).toBe(true);
    expect(result.mobile.viewportContent).toContain('width=device-width');
    expect(result.branding.hasFavicon).toBe(true);
    expect(result.branding.faviconUrl).toBe('/favicon.ico');
  });

  it('should handle missing technical features and http', () => {
    const html = `<html><head></head><body></body></html>`;
    const result = getTechnicalData(html, 'http://example.com');

    expect(result.security.isHttps).toBe(false);
    expect(result.mobile.hasViewport).toBe(false);
    expect(result.branding.hasFavicon).toBe(false);
  });
});
