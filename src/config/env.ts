import 'dotenv/config';

const env = {
  port: process.env.PORT || '3000',
  nodeEnv: process.env.NODE_ENV || 'dev',
  logLevel: process.env.LOG_LEVEL || 'info',
  saltRounds: Number(process.env.SALT_ROUNDS) || 10,
  numWorkers: Number(process.env.NUM_WROKERS) || 0,
  mongodbUrl: process.env.MONGODB_URL || '',
  mongodbPoolSize: Number(process.env.MONGODB_POOL_SIZE) || 100,
  accessSecret: process.env.ACCESS_SECRET || '',
  refreshSecret: process.env.REFRESH_SECRET || '',
  accessExpiry: process.env.ACCESS_EXPIRY || '',
  refreshExpiry: process.env.REFRESH_EXPIRY || '',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  redisTokenTTL: Number(process.env.REDIS_TOKEN_TTL) || 0,
  otpExpiry: Number(process.env.OTP_EXPIRY) || 10,
  smtpService: process.env.SMTP_SERVICE || '',
  smtpUser: process.env.SMTP_USER || '',
  smtpPassword: process.env.SMTP_PASSWORD || '',
  smtpPort: process.env.SMTP_PORT || '587',
  smtpHost: process.env.SMTP_HOST || '',
  redirectUrl: process.env.REDIRECT_URL || 'http://localhost:3000',
};

export const getEnvConfig = () => {
  return Object.freeze({
    ...env,
  });
};
