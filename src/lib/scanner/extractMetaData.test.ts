import { describe, it, expect } from 'vitest';
import { getMetaData } from './extractMetaData';

describe('Scanner: extractMetaData', () => {
  it('should extract title and description correctly', () => {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>My Awesome Website</title>
        <meta name="description" content="This is a great website for SEO testing.">
        <link rel="canonical" href="https://example.com/page" />
      </head>
      <body></body>
      </html>
    `;
    const result = getMetaData(html, 'https://example.com/page');

    expect(result.title.value).toBe('My Awesome Website');
    expect(result.title.isMissing).toBe(false);
    
    expect(result.description.value).toBe('This is a great website for SEO testing.');
    expect(result.description.isMissing).toBe(false);

    expect(result.canonical.value).toBe('https://example.com/page');
    expect(result.canonical.matchesUrl).toBe(true);
  });

  it('should flag missing and too long metadata', () => {
    const html = `<html><head><title>Too long title that definitely exceeds the sixty character limit recommended by google</title></head></html>`;
    const result = getMetaData(html, 'https://example.com/page');

    expect(result.title.isTooLong).toBe(true);
    expect(result.description.isMissing).toBe(true);
  });
});
