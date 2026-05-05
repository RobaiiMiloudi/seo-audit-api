import type { PerformanceReport } from '../performance/index.js';
import type { ScrapeResult } from '../scraper/index.js';

export type AuditStatus = 'pending' | 'scraping' | 'analyzing_performance' | 'completed' | 'failed';

export interface AuditJobData {
  url: string;
  depth: number;
}

export interface AuditResultRecord {
  id: string;
  url: string;
  status: AuditStatus;
  result: string | null;
  error: string | null;
  created_at: number;
  updated_at: number;
}

export interface AuditResponse {
  status: AuditStatus;
  url: string;
  result: any | null;
  error: string | null;
  createdAt: number;
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

export interface AuditScoreResult {
  score: number;
  suggestions: Suggestion[];
}

export interface FullAuditReport {
  url: string;
  score: number;
  grade: string;
  timestamp: string;
  data: ScrapeResult;
  lighthouse: PerformanceReport | null;
  suggestions: Suggestion[];
}
