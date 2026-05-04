import { z } from 'zod';

export const auditRequestSchema = z.object({
  url: z.string().url({ message: "Invalid URL format. Please include http:// or https:// and a valid domain." }),
  depth: z.number().int().min(1).max(5).default(1)
});

export type AuditRequest = z.infer<typeof auditRequestSchema>;

export const auditResponseSchema = z.object({
  jobId: z.string()
});

export const auditStatusSchema = z.object({
  // UPDATE THIS LINE: Add 'scraping' and 'analyzing_performance'
  status: z.enum(['pending', 'scraping', 'analyzing_performance', 'completed', 'failed']),
  url: z.string().url(),
  result: z.any().nullable(),
  error: z.string().nullable(),
  createdAt: z.number()
});