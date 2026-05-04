import { describe, it, expect } from 'vitest';
import { getLinks } from './extractLinks';

describe('Scanner: extractLinks', () => {
  it('should classify internal and external links correctly', () => {
    const html = `
      <html>
      <body>
        <a href="/about-us">About Us</a>
        <a href="https://example.com/contact">Contact</a>
        <a href="https://google.com">Google</a>
        <a href="#">Skip</a>
      </body>
      </html>
    `;
    const result = getLinks(html, 'https://example.com');

    // Expected: 3 total links (ignores '#')
    // Internal: /about-us, https://example.com/contact
    // External: https://google.com
    expect(result.totalLinks).toBe(3);
    expect(result.internalCount).toBe(2);
    expect(result.externalCount).toBe(1);
  });

  it('should detect nofollow and generic anchor text', () => {
    const html = `
      <html>
      <body>
        <a href="/post" rel="nofollow">Read more</a>
        <a href="/awesome-post">Awesome Article</a>
      </body>
      </html>
    `;
    const result = getLinks(html, 'https://example.com');

    expect(result.nofollowCount).toBe(1);
    expect(result.genericAnchorCount).toBe(1); // "Read more"
    
    expect(result.details[0].isGenericAnchor).toBe(true);
    expect(result.details[0].isNofollow).toBe(true);
  });
});
