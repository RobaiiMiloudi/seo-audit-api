import { describe, it, expect } from 'vitest';
import { getImages } from './extractImages';

describe('Scanner: extractImages', () => {
  it('should extract images correctly', () => {
    const html = `
      <html>
      <body>
        <img src="https://example.com/logo.png" alt="Company Logo" loading="lazy" />
        <img src="/images/hero.jpg" alt="" />
        <img src="https://other.com/12345.jpg" />
      </body>
      </html>
    `;
    const result = getImages(html);

    expect(result.totalImages).toBe(3);
    expect(result.missingAltCount).toBe(2); // hero.jpg and 12345.jpg
    expect(result.notLazyCount).toBe(2); // hero.jpg and 12345.jpg
    
    // Check first image
    expect(result.details[0].fileName).toBe('logo.png');
    expect(result.details[0].isLazy).toBe(true);
    expect(result.details[0].isAltMissing).toBe(false);

    // Check third image (generic name)
    expect(result.details[2].fileName).toBe('12345.jpg');
    expect(result.details[2].isFileNameGeneric).toBe(true);
  });
});
