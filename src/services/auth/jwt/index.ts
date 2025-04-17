import { getEnvConfig } from '../../../config/env';
import { IUser } from '../../../entities/user';
import jwt from 'jsonwebtoken';

interface ITokenPayload {
  sub: string; // user id
  username: string;
  email: string;
  role: string;
  // add other claims as needed (e.g., iss, aud)
}

const { accessTokenSecret, accessTokenExpiry, refreshTokenSecret, refreshTokenExpiry } = getEnvConfig();

export const generateAccessToken = async (user: IUser) => {
  const tokenPayload: ITokenPayload = { ...user, sub: user._id.toString() };
  // @ts-ignore FIXME
  return jwt.sign(
      tokenPayload,
      accessTokenSecret,
      { expiresIn: accessTokenExpiry },
  );
};
