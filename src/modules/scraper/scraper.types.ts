export interface MetaDataReport {
  title: { value: string; length: number; isMissing: boolean; isTooShort: boolean; isTooLong: boolean; };
  description: { value: string; length: number; isMissing: boolean; isTooLong: boolean; };
  canonical: { value: string; isMissing: boolean; matchesUrl: boolean; };
  robots: { value: string; isNoIndex: boolean; };
}

export interface HeadingItem {
  level: number;
  text: string;
  length?: number;
}

export interface ContentStructureReport {
  h1: { values: string[]; isMissing: boolean; isMultiple: boolean; };
  headings: { items: HeadingItem[]; hasSkippedLevel: boolean; };
  wordCount: { count: number; isThinContent: boolean; };
  language: { value: string; isMissing: boolean; };
}

export interface ImageIssue {
  src: string;
  fileName: string;
  alt: string;
  isAltMissing: boolean;
  isLazy: boolean;
  isFileNameGeneric?: boolean;
}

export interface ImageReport {
  totalImages: number;
  missingAltCount: number;
  notLazyCount: number;
  details: ImageIssue[];
}

export interface LinkItem {
  href: string;
  text: string;
  isInternal: boolean;
  isExternal?: boolean;
  isGenericAnchor: boolean;
  isNofollow: boolean;
}

export interface LinkReport {
  totalLinks: number;
  internalCount: number;
  externalCount: number;
  genericAnchorCount: number;
  nofollowCount: number;
  details: LinkItem[];
}

export interface SocialReport {
  openGraph: { title: string; description: string; image: string; isMissing: boolean; hasImage: boolean; };
  twitter: { card: string; title: string; description: string; image: string; isMissing: boolean; };
  schema: { detected: boolean; types: string[]; count: number; };
}

export interface TechnicalReport {
  security: { isHttps: boolean; };
  mobile: { hasViewport: boolean; viewportContent: string; };
  branding: { hasFavicon: boolean; faviconUrl: string; };
  discovery?: { sitemapUrl?: string; robotsAllowed?: boolean; };
}

export interface ScrapeResult {
  meta: MetaDataReport;
  content: ContentStructureReport;
  images: ImageReport;
  links: LinkReport;
  social: SocialReport;
  technical: TechnicalReport;
  error?: string;
}
