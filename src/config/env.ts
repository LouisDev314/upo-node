import 'dotenv/config';
// import { IEnvConfig } from '../interfaces/env-config';

const env = {
  port: process.env.PORT || '3000',
  nodeEnv: process.env.NODE_ENV || 'dev',
  logLevel: process.env.LOG_LEVEL || 'info',
  mongodbUrl: process.env.MONGODB_URL || '',
  mongodbUsername: process.env.MONGODB_USERNAME || '',
  mongodbPassword: process.env.MONGODB_PASSWORD || '',
  mongodbPoolSize: Number(process.env.MONGODB_POOL_SIZE) || 100,
  mongodbHost: process.env.MONGODB_HOST || '',
  debugMode: process.env.DEBUG_MODE || 'true',
  accessKey: process.env.ACCESS_KEY || '',
  refreshKey: process.env.REFRESH_KEY || '',
  accessExp: process.env.ACCESS_EXP || '',
  refreshExp: process.env.REFRESH_EXP || '',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  redisTokenTTL: Number(process.env.REDIS_TOKEN_TTL) || 0,
  smtpKey: process.env.SMTP_KEY || '',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT) || 587,
  smtpUser: process.env.SMTP_USER || '',
};

export const getEnvConfig = () => {
  return Object.freeze({
    ...env,
  });
};