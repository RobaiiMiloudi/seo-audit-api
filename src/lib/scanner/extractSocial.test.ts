import { describe, it, expect } from 'vitest';
import { getSocialData } from './extractSocial';

describe('Scanner: extractSocial', () => {
  it('should extract Open Graph and Twitter Card tags', () => {
    const html = `
      <html>
      <head>
        <meta property="og:title" content="OG Title" />
        <meta property="og:image" content="og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
      </head>
      <body></body>
      </html>
    `;
    const result = getSocialData(html);

    expect(result.openGraph.title).toBe('OG Title');
    expect(result.openGraph.hasImage).toBe(true);
    expect(result.openGraph.isMissing).toBe(false);

    expect(result.twitter.card).toBe('summary_large_image');
    expect(result.twitter.isMissing).toBe(false);
  });

  it('should extract Schema.org JSON-LD', () => {
    const html = `
      <html>
      <head>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "Test Article"
          }
        </script>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Test Org"
          }
        </script>
      </head>
      <body></body>
      </html>
    `;
    const result = getSocialData(html);

    expect(result.schema.detected).toBe(true);
    expect(result.schema.count).toBe(2);
    expect(result.schema.types).toContain('Article');
    expect(result.schema.types).toContain('Organization');
  });
});
