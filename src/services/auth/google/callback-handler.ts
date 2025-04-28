import { generateTokens, storeRefreshToken } from '../jwt';
import { IUser } from '../../../entities/user';

export const googleCallbackHandler = async (user: IUser, deviceId: string) => {
  const tokens = generateTokens({
    sub: user.googleId!,
    username: user.username,
    email: user.email,
    role: user.role,
  });

  await storeRefreshToken(user.googleId!, deviceId, tokens.refreshToken);

  return tokens;
};
