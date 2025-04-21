import crypto from 'crypto';
import { getRedisInstance } from '../redis';
import { getEnvConfig } from '../../config/env';
import { transporter } from './index';
import Exception from '../../errors/Exception';
import { HttpStatusCode } from 'axios';
import logger from '../logger';

const { otpExpiry, smtpUser } = getEnvConfig();

export const generateAndSendOTP = async (email: string) => {
  try {
    // Generate 6-digit numeric OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    const redis = getRedisInstance();
    await redis.set(email, otp, 'EX', otpExpiry);

    await transporter.sendMail({
      from: smtpUser,
      to: email,
      subject: 'Your Verification Code',
      // text: `Your verification code is: ${otp}\nThis code will expire in 10 minutes.`,
      html: `Your verification code is: <b>${otp}</b>.\n\nThis code will expire in 10 minutes.`,
    });
  } catch (err) {
    logger.error('Email send error:', err);
    throw new Exception(HttpStatusCode.InternalServerError, 'Failed to send email');
  }
};

export const verifyOTP = async (email: string, userOTP: string) => {
  const redis = getRedisInstance();

  const storedOTP = await redis.get(email);
  if (!storedOTP || storedOTP !== userOTP) throw new Exception(HttpStatusCode.Unauthorized, 'Invalid OTP');

  await redis.del(email);
};
