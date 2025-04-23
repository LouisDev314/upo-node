import nodemailer, { TransportOptions } from 'nodemailer';
import { getEnvConfig } from '../../config/env';
import logger from '../logger';

const { smtpUser, smtpPort, smtpPassword, smtpHost } = getEnvConfig();

export const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === '465',
  auth: {
    user: smtpUser,
    pass: smtpPassword,
  },
} as TransportOptions);

transporter.verify((err) =>
  err ? logger.error('SMTP connection error:', err) : logger.info('SMTP server is ready to send emails'),
);
