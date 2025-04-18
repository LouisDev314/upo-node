import { getEnvConfig } from '../../../config/env';
import jwt from 'jsonwebtoken';
import Exception from '../../../errors/Exception';
import { HttpStatusCode } from 'axios';
import { getRedisInstance } from '../../redis';

interface ITokens {
  accessToken: string;
  refreshToken: string;
}

interface ITokenPayload {
  sub: string; // user id
  username: string;
  email: string;
  role: string;
  // add other claims as needed (e.g., iss, aud)
}

const { accessSecret, accessExpiry, refreshSecret, refreshExpiry } = getEnvConfig();

// FIXME
export const generateTokens = (tokenPayload: ITokenPayload) => {
  return {
    // @ts-ignore
    accessToken: jwt.sign(tokenPayload, accessSecret, { expiresIn: accessExpiry }),
    // @ts-ignore
    refreshToken: jwt.sign(tokenPayload, refreshSecret, { expiresIn: refreshExpiry }),
  };
};

export const storeRefreshToken = async (userId: string, token: string) => {
  const redis = getRedisInstance();
  await redis.set(`${userId}:${token}`, 'valid', 'EX', getEnvConfig().redisTokenTTL);
};

export const verifyRedisToken = async (userId: string, token: string) => {
  const redis = getRedisInstance();
  const exists = await redis.exists(`${userId}:${token}`);
  return exists === 1;
};

export const revokePrevRefreshToken = async (userId: string, token: string) => {
  const redis = getRedisInstance();
  await redis.del(`${userId}:${token}`);
};

export const rotateTokens = async (prevRefreshToken: string): Promise<ITokens> => {
  const decoded = jwt.verify(prevRefreshToken, refreshSecret) as ITokenPayload;

  const isValid = await verifyRedisToken(decoded.sub, prevRefreshToken);
  if (!isValid) {
    throw new Exception(HttpStatusCode.Unauthorized, 'Invalid refresh token');
  }

  await revokePrevRefreshToken(decoded.sub, prevRefreshToken);
  const newTokens = generateTokens(decoded);
  await storeRefreshToken(decoded.sub, newTokens.refreshToken);

  return newTokens;
};
