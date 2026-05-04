import { describe, it, expect } from 'vitest';
import { getContentStructure } from './extractContent';

describe('Scanner: extractContent', () => {
  it('should correctly analyze headings and word count', () => {
    const html = `
      <html>
      <body>
        <h1>Main Topic</h1>
        <h2>Sub Topic 1</h2>
        <p>This is some text. It has exactly ten words right here.</p>
      </body>
      </html>
    `;
    const result = getContentStructure(html);

    expect(result.h1.values).toEqual(['Main Topic']);
    expect(result.h1.isMissing).toBe(false);
    
    expect(result.headings.items.length).toBe(2);
    expect(result.headings.hasSkippedLevel).toBe(false);

    expect(result.wordCount.count).toBeGreaterThan(0);
  });

  it('should detect skipped heading levels', () => {
    const html = `
      <html><body>
        <h1>Title</h1>
        <h3>Skipped H2!</h3>
      </body></html>
    `;
    const result = getContentStructure(html);

    expect(result.headings.hasSkippedLevel).toBe(true);
  });
});
