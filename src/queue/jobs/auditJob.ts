import { scoreAudit, calculateGrade } from '../../modules/audit/audit.scorer.js';
import { updateAuditProgress, updateAuditResult, markAuditFailed } from '../../modules/audit/audit.repository.js';
import { analyzePagePerformance } from '../../modules/performance/index.js';
import { scrapePage } from '../../modules/scraper/index.js';
import type { AuditJobData } from '../../modules/audit/audit.types.js';

export async function processAuditJob(jobId: string, data: AuditJobData) {
  try {
    const scrapePromise = scrapePage(data.url);
    const performancePromise = analyzePagePerformance(data.url);

    updateAuditProgress(jobId, 'scraping', null);

    const scrapeResult = await scrapePromise;

    const partialAnalysis = scoreAudit(scrapeResult, null);
    const partialReport = {
      url: data.url,
      score: partialAnalysis.score,
      timestamp: new Date().toISOString(),
      data: scrapeResult,
      lighthouse: null,
      suggestions: partialAnalysis.suggestions
    };

    updateAuditProgress(jobId, 'analyzing_performance', partialReport);

    const performanceData = await performancePromise;

    const finalAnalysis = scoreAudit(scrapeResult, performanceData);

    const finalReport = {
      ...partialReport,
      score: finalAnalysis.score,
      grade: calculateGrade(finalAnalysis.score),
      lighthouse: performanceData,
      suggestions: finalAnalysis.suggestions
    };

    updateAuditResult(jobId, finalReport);
    return finalReport;

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    markAuditFailed(jobId, errorMessage);
    throw error;
  }
}
