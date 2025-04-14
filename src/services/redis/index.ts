import Redis from 'ioredis';
import { getEnvConfig } from '../../config/env';

let redis: Redis | null = null;

const connectUrl = getEnvConfig().redisUrl || 'redis://:password@localhost:6379';

export const getRedisInstance = () => {
  if (!redis) {
    console.error('Redis client not initialized', { redis });
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
      console.error('Redis connection failed or closed unexpectedly', { error });
      process.exit(-1);
    });

    console.log('Connected to Redis');
  } catch (err) {
    console.error('Connection to Redis failed', { url: connectUrl, err });
    throw err;
  }
};

export const redisStop = (client: Redis) => {
  client.disconnect();
  console.info('Disconnected from Redis');
};