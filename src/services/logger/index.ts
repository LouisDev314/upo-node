import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { getEnvConfig } from '../../config/env';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
};

const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.align(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${level.toUpperCase()}] ${timestamp} ${message}`;
    }),
);

// Daily Rotate File Transport for application logs
const combinedFileTransport = new DailyRotateFile({
  filename: 'logs/application-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true, // Compress old log files
  maxSize: '20m', // Rotate when file size exceeds 20MB
  maxFiles: '14d', // Keep logs for the last 14 days
});

// Daily Rotate File Transport for error logs
const errorFileTransport = new DailyRotateFile({
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'error', // Only log errors to this file
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
});

// Console Transport for development and real-time monitoring
const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
      winston.format.colorize({ all: true }),
  ),
});

// Create the logger instance
const logger = winston.createLogger({
  levels,
  level: getEnvConfig().logLevel,
  format,
  transports: [
    errorFileTransport, // Error logs
    consoleTransport, // Console output
  ],
});

if (getEnvConfig().nodeEnv === 'prod') {
  logger.add(combinedFileTransport); // Application logs
}

// Handle uncaught exceptions and unhandled rejections in production
logger.exceptions.handle(
    new DailyRotateFile({
      filename: 'logs/exceptions-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),
);

logger.rejections.handle(
    new DailyRotateFile({
      filename: 'logs/rejections-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),
);

export default logger;
