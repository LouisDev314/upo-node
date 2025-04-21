import User from '../../entities/user';
import Exception from '../../errors/Exception';
import { HttpStatusCode } from 'axios';
import bcrypt from 'bcrypt';
import { getEnvConfig } from '../../config/env';
import {
  generateTokens,
  ITokenPayload,
  revokePrevRefreshToken,
  rotateTokens,
  storeRefreshToken,
  verifyRedisToken,
} from './jwt';
import jwt from 'jsonwebtoken';
import { generateAndSendOTP } from '../smtp/otp';

export const verifyEmail = async (email: string) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new Exception(HttpStatusCode.Conflict, 'Email already registered');

  await generateAndSendOTP(email);
};

export const register = async (username: string, email: string, password: string) => {
  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existingUser) throw new Exception(HttpStatusCode.Conflict, 'Username or email already exists');

  // TODO: might use JSEncrypt (RSA) to pass in password -> decrypt with key
  const hash = await bcrypt.hash(password, getEnvConfig().saltRounds);
  const newUser = { username, email, password: hash };

  return await User.create(newUser);
};

export const login = async (username: string, email: string, password: string, deviceId: string) => {
  const user = await User.findOne({
    $or: [{ username }, { email }],
  }).lean();
  if (!user) throw new Exception(HttpStatusCode.Unauthorized, 'Invalid credentials');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Exception(HttpStatusCode.Unauthorized, 'Invalid credentials');

  const tokens = generateTokens({
    sub: user._id.toString(),
    username: user.username,
    email: user.email,
    role: user.role,
  });

  await storeRefreshToken(user._id.toString(), deviceId, tokens.refreshToken);

  return tokens;
};

export const refreshTokens = async (deviceId: string, refreshToken: string) => {
  if (!refreshToken) throw new Exception(HttpStatusCode.BadRequest, 'Refresh token required');
  return await rotateTokens(refreshToken, deviceId);
};

export const logout = async (deviceId: string, refreshToken: string) => {
  try {
    const decoded = jwt.verify(refreshToken, getEnvConfig().refreshSecret) as ITokenPayload;

    const isValid = await verifyRedisToken(decoded.sub, deviceId, refreshToken);
    if (!isValid) throw new Exception(HttpStatusCode.Forbidden, 'Token expired');

    await revokePrevRefreshToken(decoded.sub, deviceId);
  } catch (err) {
    if (err instanceof Error && err.name.includes('Token')) throw new Exception(HttpStatusCode.Forbidden, 'Invalid token');
    if (err instanceof Exception) throw err;
    throw new Exception(HttpStatusCode.InternalServerError, 'Unable to logout', { err });
  }
};
