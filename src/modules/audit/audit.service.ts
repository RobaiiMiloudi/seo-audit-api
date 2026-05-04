import crypto from 'node:crypto';
import { auditQueue } from '../../queue/client.js';
import { createPendingAudit, getAuditById } from './audit.repository.js';
import { AuditRequest } from './audit.schema.js';
import { AuditResponse } from '../../types/index.js';

export async function enqueueAudit(data: AuditRequest): Promise<{ jobId: string }> {
  // Use crypto for a quick UUID (node:crypto)
  const jobId = crypto.randomUUID();
  
  createPendingAudit(jobId, data.url);
  
  await auditQueue.add('auditJob', {
    url: data.url,
    depth: data.depth
  }, {
    jobId, // Use the same ID in BullMQ for consistency
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  });

  return { jobId };
}

export function getAuditStatus(jobId: string): AuditResponse | null {
  const record = getAuditById(jobId);
  if (!record) {
    return null;
  }

  let resultParsed = null;
  if (record.result) {
    try {
      resultParsed = JSON.parse(record.result);
    } catch (e) {
      console.error('Failed to parse audit result for jobId:', jobId);
    }
  }

  return {
    status: record.status,
    url: record.url,
    result: resultParsed,
    error: record.error,
    createdAt: record.created_at
  };
}
