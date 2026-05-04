export interface AuditJobData {
  url: string;
  depth: number;
}

export interface AuditResultRecord {
  id: string;
  url: string;
  // Updated statuses
  status: 'pending' | 'scraping' | 'analyzing_performance' | 'completed' | 'failed';
  result: string | null;
  error: string | null;
  created_at: number;
  updated_at: number;
}

export interface AuditResponse {
  // UPDATE THIS LINE: Add the new statuses
  status: 'pending' | 'scraping' | 'analyzing_performance' | 'completed' | 'failed';
  url: string;
  result: any | null;
  error: string | null;
  createdAt: number;
}
// --- Scraper Types ---

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

export interface LighthouseReport {
  performanceScore: number;
  speedIndex: number;
  largestContentfulPaint: number;
  totalBlockingTime: number;
  cumulativeLayoutShift: number;
}

export interface Suggestion {
  id: string;
  severity: 'critical' | 'warning' | 'minor' | 'info';
  category: 'meta' | 'technical' | 'content' | 'images' | 'performance' | 'links';
  message: string;
  action: string;
  rationale: string;
  deduction: number;
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

export interface FullAuditReport {
  url: string;
  score: number;
  grade: string;
  timestamp: string;
  data: ScrapeResult;
  lighthouse: LighthouseReport | null;
  suggestions: Suggestion[];
}
