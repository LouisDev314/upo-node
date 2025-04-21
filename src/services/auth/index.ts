import User, { IUser } from '../../entities/user';
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
import { Request } from 'express';
import retrieveToken from '../../utils/retrieve-token';
import jwt from 'jsonwebtoken';

export const register = async (payload: Pick<IUser, 'username' | 'email' | 'password'>) => {
  const existingUser = await User.findOne({
    $or: [{ username: payload.username }, { email: payload.email }],
  });
  if (existingUser) throw new Exception(HttpStatusCode.Conflict, 'Username or email already exists');

  // TODO: email verification

  // TODO: might use JSEncrypt (RSA) to pass in password -> decrypt with key
  const hash = await bcrypt.hash(payload.password, getEnvConfig().saltRounds);
  const newUser = { ...payload, password: hash };

  return await User.create(newUser);
};

export const login = async (payload: IUser & { deviceId: string }) => {
  const user = await User.findOne({
    $or: [{ username: payload.username }, { email: payload.email }],
  }).lean();
  if (!user) throw new Exception(HttpStatusCode.Unauthorized, 'Invalid credentials');

  const isMatch = await bcrypt.compare(payload.password, user.password);
  if (!isMatch) throw new Exception(HttpStatusCode.Unauthorized, 'Invalid credentials');

  const tokens = generateTokens({
    sub: user._id.toString(),
    username: user.username,
    email: user.email,
    role: user.role,
  });

  await storeRefreshToken(user._id.toString(), payload.deviceId, tokens.refreshToken);

  return tokens;
};

export const refreshTokens = async (req: Request) => {
  const refreshToken = retrieveToken(req);
  if (!refreshToken) throw new Exception(HttpStatusCode.BadRequest, 'Refresh token required');
  return await rotateTokens(refreshToken, req.body.deviceId);
};

export const logout = async (req: Request) => {
  try {
    const refreshToken = retrieveToken(req);
    if (!refreshToken) throw new Exception(HttpStatusCode.BadRequest, 'Refresh token required');

    const decoded = jwt.verify(refreshToken, getEnvConfig().refreshSecret) as ITokenPayload;

    const isValid = await verifyRedisToken(decoded.sub, req.body.deviceId, refreshToken);
    if (!isValid) throw new Exception(HttpStatusCode.Forbidden, 'Invalid refresh token');

    await revokePrevRefreshToken(decoded.sub, req.body.deviceId);
  } catch (err) {
    if (err instanceof Error && err.name.includes('Token')) throw new Exception(HttpStatusCode.Forbidden, 'Invalid token');
    if (err instanceof Exception) throw err;
    throw new Exception(HttpStatusCode.InternalServerError, 'Unable to logout', { err });
  }
};
