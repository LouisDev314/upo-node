import cluster from 'cluster';
import logger from '../logger';

export function initWithCluster(init: () => Promise<void>, shutdown: () => Promise<void>, numWorkers: number) {
  if (numWorkers > 0 && cluster.isPrimary) {
    logger.info(`Primary process ${process.pid} running in cluster mode with ${numWorkers} workers`);

    // Fork workers
    for (let i = 0; i < numWorkers; i++) {
      cluster.fork();
    }

    // Restart dead workers
    cluster.on('exit', (worker, code, signal) => {
      logger.info(`${worker.process.pid} died with code: ${code} and signal: ${signal}. Restarting...`);
      cluster.fork();
    });
  } else {
    // Worker or single-process mode
    init().catch((err) => {
      logger.error('Failed to start server:', err);
      process.exit(1);
    });

    ['SIGINT', 'SIGTERM'].forEach((signal) => {
      process.on(signal, async () => {
        logger.info(`${process.pid} received ${signal}. Shutting down gracefully...`);
        await shutdown();
      });
    });
  }
}
