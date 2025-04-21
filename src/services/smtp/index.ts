import nodemailer from 'nodemailer';
import { getEnvConfig } from '../../config/env';

const { smtpUser, smtpService, smtpHost, smtpPort } = getEnvConfig();

interface ISMTPConfig {
  service: string;
  auth: {
    user: string;
    pass: string;
  };
}

export const transporter = nodemailer.createTransport({
  service: smtpService,
  host: smtpHost,
  port: smtpPort,
  secure: false,
  auth: {
    user: smtpUser,
    pass: process.env.EMAIL_PASSWORD,
  },
} as ISMTPConfig);
