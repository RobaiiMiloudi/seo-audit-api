import { Queue } from 'bullmq';
import { config } from '../config.js';

export const connection = {
  host: config.REDIS_HOST,
  port: config.REDIS_PORT
};

export const auditQueue = new Queue('audit', {
  connection
});
