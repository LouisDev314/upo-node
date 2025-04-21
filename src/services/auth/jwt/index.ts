import { getEnvConfig } from '../../../config/env';
import jwt from 'jsonwebtoken';
import Exception from '../../../errors/Exception';
import { HttpStatusCode } from 'axios';
import { getRedisInstance } from '../../redis';

export interface ITokenPayload {
  sub: string; // user id
  username: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

const { accessSecret, accessExpiry, refreshSecret, refreshExpiry } = getEnvConfig();

// FIXME
export const generateTokens = (tokenPayload: ITokenPayload) => {
  try {
    // Destructure to remove 'iat' and 'exp' if present
    // eslint-disable-next-line
    const { iat, exp, ...cleanPayload } = tokenPayload;
    return {
      // @ts-ignore
      accessToken: jwt.sign(cleanPayload, accessSecret, { expiresIn: accessExpiry }),
      // @ts-ignore
      refreshToken: jwt.sign(cleanPayload, refreshSecret, { expiresIn: refreshExpiry }),
    };
  } catch (err) {
    throw new Exception(HttpStatusCode.InternalServerError, 'Unable to sign tokens:', { err });
  }
};

export const authenticateAccessToken = (token: string) => {
  try {
    return jwt.verify(token, accessSecret);
  } catch (err) {
    if (err instanceof Error && err.name.includes('Token')) throw new Exception(HttpStatusCode.Unauthorized, 'Invalid token');
    throw new Exception(HttpStatusCode.InternalServerError, 'Unable to verify access token', { err });
  }
};

export const storeRefreshToken = async (userId: string, deviceId: string, token: string) => {
  const redis = getRedisInstance();
  await redis.set(`${userId}:${deviceId}`, token, 'EX', getEnvConfig().redisTokenTTL);
};

export const verifyRedisToken = async (userId: string, deviceId: string, token: string) => {
  const redis = getRedisInstance();
  const storedToken = await redis.get(`${userId}:${deviceId}`);
  return token === storedToken;
};

export const revokePrevRefreshToken = async (userId: string, deviceId: string) => {
  const redis = getRedisInstance();
  await redis.del(`${userId}:${deviceId}`);
};

export const rotateTokens = async (prevRefreshToken: string, deviceId: string) => {
  try {
    const decoded = jwt.verify(prevRefreshToken, refreshSecret) as ITokenPayload;

    const isValid = await verifyRedisToken(decoded.sub, deviceId, prevRefreshToken);
    if (!isValid) throw new Exception(HttpStatusCode.Forbidden, 'Token expired');

    // await revokePrevRefreshToken(decoded.sub, deviceId);
    const newTokens = generateTokens(decoded);
    await storeRefreshToken(decoded.sub, deviceId, newTokens.refreshToken);

    return newTokens;
  } catch (err) {
    if (err instanceof Error && err.name.includes('Token')) throw new Exception(HttpStatusCode.Forbidden, 'Invalid token');
    if (err instanceof Exception) throw err;
    throw new Exception(HttpStatusCode.InternalServerError, 'Unable to rotate token', { err });
  }
};
