import User, { UserZod } from '../../entities/user';
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

export const verifyEmail = async (email: string) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new Exception(HttpStatusCode.Conflict, 'Email already registered');
};

export const register = async (username: string, email: string, password?: string, googleId?: string) => {
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) throw new Exception(HttpStatusCode.Conflict, 'Username already exists');

    let newUser;
    if (password) {
      // TODO: might use JSEncrypt (RSA) to pass in password -> decrypt with key
      const hash = await bcrypt.hash(password, getEnvConfig().saltRounds);
      newUser = { username, email, password: hash };
    } else {
      newUser = { username, email, googleId };
    }

    const parsed = UserZod.parse(newUser);
    return await User.create(parsed);
  } catch (err) {
    if (err instanceof Exception) throw err;
    throw new Exception(HttpStatusCode.InternalServerError, 'User unable to register', { err });
  }
};

export const login = async (username: string, email: string, password: string, deviceId: string) => {
  const user = await User.findOne({
    $or: [{ username }, { email }],
  })
    .select('+password')
    .lean();
  if (!user) throw new Exception(HttpStatusCode.Unauthorized, 'Invalid credentials');

  // Edge Case: user try to log in with Google OAuth registered email
  if (!user.password) throw new Exception(HttpStatusCode.BadRequest, 'Account registered via OAuth');

  const isMatch = await bcrypt.compare(password, user.password!);
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

export const setPassword = async (email: string, password: string) => {
  const hash = await bcrypt.hash(password, getEnvConfig().saltRounds);
  await User.findOneAndUpdate({ email }, { password: hash });
};
