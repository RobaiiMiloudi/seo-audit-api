// src/queue/jobs/auditJob.ts
import {
  performInitialScrape,
  fetchLighthouseData,
  calculateScoreAndSuggestions
} from '../../lib/scanner/masterScraper.js';
import { updateAuditProgress, updateAuditResult, markAuditFailed } from '../../modules/audit/audit.repository.js';
import { AuditJobData } from '../../types/index.js';

export async function processAuditJob(jobId: string, data: AuditJobData) {
  try {
    // --- START BOTH CONCURRENTLY ---
    // We don't use 'await' here yet. Both processes start NOW.
    const scrapePromise = performInitialScrape(data.url);
    const lighthousePromise = fetchLighthouseData(data.url);

    updateAuditProgress(jobId, 'scraping', null);

    // --- WAIT FOR SCRAPE (Phase 1) ---
    // This will finish in ~2-3 seconds. Lighthouse is still running in the background.
    const scrapeResult = await scrapePromise;

    // Calculate partial score
    const partialAnalysis = calculateScoreAndSuggestions(scrapeResult, null);
    const partialReport = {
      url: data.url,
      score: partialAnalysis.score,
      timestamp: new Date().toISOString(),
      data: scrapeResult,
      lighthouse: null,
      suggestions: partialAnalysis.suggestions
    };

    // UPDATE DB IMMEDIATELY: The user sees data now!
    updateAuditProgress(jobId, 'analyzing_performance', partialReport);

    // --- WAIT FOR LIGHTHOUSE (Phase 2) ---
    // This was already running! We just 'await' the result here.
    // If Lighthouse took 30s and we spent 3s scraping, we only wait 27s more.
    const lighthouseData = await lighthousePromise;

    // --- FINALIZATION ---
    const finalAnalysis = calculateScoreAndSuggestions(scrapeResult, lighthouseData);

    let grade = 'F';
    if (finalAnalysis.score >= 90) grade = 'A';
    else if (finalAnalysis.score >= 80) grade = 'B';
    else if (finalAnalysis.score >= 70) grade = 'C';
    else if (finalAnalysis.score >= 60) grade = 'D';

    const finalReport = {
      ...partialReport,
      score: finalAnalysis.score,
      grade,
      lighthouse: lighthouseData,
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