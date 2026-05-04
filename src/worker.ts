// Entry point for the BullMQ Worker
import './queue/worker.js';

console.log('[Worker] Started audit worker process.');

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('[Worker] Shutting down...');
  process.exit(0);
});
process.on('SIGTERM', () => {
  console.log('[Worker] Shutting down...');
  process.exit(0);
});
