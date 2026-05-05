export type {
  AuditJobData,
  AuditResponse,
  AuditResultRecord,
  AuditScoreResult,
  AuditStatus,
  FullAuditReport,
  Suggestion,
} from '../modules/audit/audit.types.js';

export type {
  ContentStructureReport,
  HeadingItem,
  ImageIssue,
  ImageReport,
  LinkItem,
  LinkReport,
  MetaDataReport,
  ScrapeResult,
  SocialReport,
  TechnicalReport,
} from '../modules/scraper/index.js';

export type { PerformanceReport as LighthouseReport } from '../modules/performance/index.js';
