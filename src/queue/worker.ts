import { Worker } from 'bullmq';
import { connection } from './client.js';
import { processAuditJob } from './jobs/auditJob.js';
import { AuditJobData } from '../types/index.js';

export const auditWorker = new Worker<AuditJobData>(
  'audit',
  async (job) => {
    if (!job.id) {
      throw new Error('Job missing ID');
    }
    console.log(`[Worker] Starting job ${job.id} for URL: ${job.data.url}`);
    const result = await processAuditJob(job.id, job.data);
    console.log(`[Worker] Finished job ${job.id}`);
    return result;
  },
  {
    connection,
    concurrency: 3
  }
);

auditWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err.message);
});

auditWorker.on('error', (err) => {
  console.error('[Worker] Error:', err);
});
