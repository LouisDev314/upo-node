import crypto from 'crypto';
import { getRedisInstance } from '../redis';
import { getEnvConfig } from '../../config/env';
import { transporter } from './index';
import Exception from '../../errors/Exception';
import { HttpStatusCode } from 'axios';
import logger from '../logger';
import rateLimit from 'express-rate-limit';

const { otpExpiry, smtpUser } = getEnvConfig();

export const generateAndSendOTP = async (email: string) => {
  try {
    const redis = getRedisInstance();

    // Generate 6-digit numeric OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    await redis.set(email, otp, 'EX', otpExpiry);

    await transporter.sendMail({
      from: smtpUser,
      to: email,
      subject: `Email verification code ${otp}`,
      // text: `Your verification code is: ${otp}\nThis code will expire in 10 minutes.`,
      html: `Your verification code is <b>${otp}</b>.\n\nThis code will expire in 10 minutes.`,
    });
  } catch (err) {
    logger.error('Failed to send OTP:', err);
    throw new Exception(HttpStatusCode.InternalServerError, 'Failed to send email');
  }
};

export const verifyOTP = async (email: string, userOTP: string) => {
  const redis = getRedisInstance();

  const storedOTP = await redis.get(email);
  if (!storedOTP || storedOTP !== userOTP) throw new Exception(HttpStatusCode.Unauthorized, 'Invalid OTP');

  await redis.del(email);
};

export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: () => {
    throw new Exception(HttpStatusCode.TooManyRequests, 'Too many OTP requests, please try again later.');
  },
});
