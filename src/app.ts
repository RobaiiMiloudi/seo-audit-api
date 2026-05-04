import Fastify, { FastifyInstance } from 'fastify';
import corsPlugin from './plugins/cors.js';
import rateLimitPlugin from './plugins/rateLimit.js';
import sensiblePlugin from './plugins/sensible.js';
import auditRoutes from './modules/audit/audit.route.js';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: true
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Register plugins
  app.register(corsPlugin);
  app.register(rateLimitPlugin);
  app.register(sensiblePlugin);

  app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'SEO Audit API',
        description: 'High-performance SEO audit microservice',
        version: '1.0.0',
      },
    },
    transform: jsonSchemaTransform,
  });

  app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
  });

  // Register routes
  app.register(auditRoutes, { prefix: '/api/audit' });

  return app;
}
