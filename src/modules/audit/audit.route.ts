import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { auditRequestSchema, auditResponseSchema, auditStatusSchema } from './audit.schema.js';
import { enqueueAudit, getAuditStatus } from './audit.service.js';

export default async function auditRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  server.post('/', {
    schema: {
      summary: 'Request a new SEO audit',
      description: 'Queues a URL for a full SEO audit and returns a unique jobId.',
      tags: ['Audit'],
      body: auditRequestSchema,
      response: {
        202: auditResponseSchema
      }
    }
  }, async (request, reply) => {
    const { jobId } = await enqueueAudit(request.body);
    return reply.status(202).send({ jobId });
  });

  server.get('/:jobId', {
    schema: {
      summary: 'Get audit status and result',
      description: 'Retrieves the current status (pending, completed, failed) and the final report if available.',
      tags: ['Audit'],
      params: z.object({
        jobId: z.string()
      }),
      response: {
        200: auditStatusSchema,
        404: z.object({
          error: z.string()
        })
      }
    }
  }, async (request, reply) => {
    const { jobId } = request.params;
    const status = getAuditStatus(jobId);
    
    if (!status) {
      return reply.status(404).send({ error: 'Job not found' });
    }

    return reply.status(200).send(status);
  });
}
