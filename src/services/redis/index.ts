import Redis from 'ioredis';
import { getEnvConfig } from '../../config/env';
import logger from '../logger';

let redis: Redis | null = null;

const connectUrl = getEnvConfig().redisUrl || 'redis://:password@localhost:6379';

export const getRedisInstance = () => {
  if (!redis) {
    logger.error('Redis client not initialized', { redis });
    throw new Error('Redis client not initialized');
  }
  return redis;
};

export const redisInit = async () => {
  try {
    redis = new Redis(connectUrl, {
      enableReadyCheck: true,
      lazyConnect: true,
    });
    await redis.connect();

    redis.on('error', (error: Error) => {
      logger.error('Redis connection failed or closed unexpectedly', { error });
      process.exit(-1);
    });

    logger.info('Connected to Redis');
  } catch (err) {
    logger.error('Connection to Redis failed', { url: connectUrl, err });
    throw err;
  }
};

export const redisStop = (client: Redis) => {
  client.disconnect();
  logger.info('Disconnected from Redis');
};