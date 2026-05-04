import { buildApp } from './app.js';
import { config } from './config.js';

const server = buildApp();

const start = async () => {
  try {
    await server.listen({ port: config.PORT, host: '0.0.0.0' });
    console.log(`[API] Server listening on port ${config.PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
