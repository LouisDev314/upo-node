import User, { IUser } from '../../entities/user';
import Exception from '../../errors/Exception';
import { HttpStatusCode } from 'axios';
import bcrypt from 'bcrypt';
import { getEnvConfig } from '../../config/env';
import { generateTokens, storeRefreshToken } from './jwt';

export const register = async (payload: Pick<IUser, 'username' | 'email' | 'password'>) => {
  const existingUser = await User.findOne({
    $or: [{ username: payload.username }, { email: payload.email }],
  });
  if (existingUser) throw new Exception(HttpStatusCode.Conflict, 'Username or email already exists');

  // TODO: might use JSEncrypt (RSA) to pass in password -> decrypt with key
  const hash = await bcrypt.hash(payload.password, getEnvConfig().saltRounds);
  const newUser = { ...payload, password: hash };

  return await User.create(newUser);
};

export const login = async (payload: IUser) => {
  const user = await User.findOne({
    $or: [{ username: payload.username }, { email: payload.email }],
  });
  if (!user) throw new Exception(HttpStatusCode.Unauthorized, 'Invalid credentials');

  const isMatch = await bcrypt.compare(payload.password, user.password);
  if (!isMatch) throw new Exception(HttpStatusCode.Unauthorized, 'Invalid credentials');

  const tokens = generateTokens({
    sub: user._id.toString(),
    username: user.username,
    email: user.email,
    role: user.role,
  });

  await storeRefreshToken(user._id.toString(), tokens.refreshToken);

  return tokens;
};
