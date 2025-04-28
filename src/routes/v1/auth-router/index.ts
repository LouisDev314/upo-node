import { Router } from 'express';
import passport from 'passport';
import {
  emailBodyValidation,
  loginBodyValidation,
  otpBodyValidation,
  registerCompleteBodyValidation,
} from '../../../middleware/auth/user-body-validation';
import { login, logout, refreshTokens, register, setPassword, verifyEmail } from '../../../services/auth';
import { IUser } from '../../../entities/user';
import { retrieveDeviceId, retrieveHeaderInfo } from '../../../utils/retrieve-header-info';
import { generateAndSendOTP, otpLimiter, verifyOTP } from '../../../services/smtp/otp';
import { googleCallbackHandler } from '../../../services/auth/google/callback-handler';
import { IGoogleUser } from '../../../services/auth/google';

const authRouter: Router = Router();

authRouter.post('/register/init', emailBodyValidation, otpLimiter, async (req, res) => {
  const { email } = req.body as Pick<IUser, 'email'>;
  await verifyEmail(email);
  await generateAndSendOTP(email);
  return res.send_ok('OTP sent to email');
});

authRouter.post('/resend-otp', emailBodyValidation, otpLimiter, async (req, res) => {
  const { email } = req.body as Pick<IUser, 'email'>;
  await generateAndSendOTP(email);
  return res.send_ok('OTP sent to email');
});

authRouter.post('/verify-otp', otpBodyValidation, async (req, res) => {
  const { email, otp } = req.body as Pick<IUser, 'email'> & { otp: string };
  await verifyOTP(email, otp);
  return res.send_ok('OTP verified');
});

authRouter.post('/register/complete', registerCompleteBodyValidation, async (req, res) => {
  const { username, email, password, googleId } = req.body as Pick<
    IUser,
    'username' | 'email' | 'password' | 'googleId'
  >;
  await register(username, email, password, googleId);
  return res.send_ok('Registered successfully');
});

// set password for user registered via OAuth
authRouter.post('/set-password', loginBodyValidation, async (req, res) => {
  const { email, password } = req.body as Pick<IUser, 'email' | 'password'>;
  await setPassword(email, password!);
  return res.send_ok('Password set');
});

// local login
authRouter.post('/login', loginBodyValidation, async (req, res) => {
  const { username, email, password } = req.body as Pick<IUser, 'username' | 'email' | 'password'>;
  const deviceId = retrieveDeviceId(req);
  const tokens = await login(username, email, password!, deviceId);
  return res.send_ok('Logged in successfully', tokens);
});

authRouter.post('/refresh', async (req, res) => {
  const deviceId = retrieveDeviceId(req);
  const refreshToken = retrieveHeaderInfo(req);
  const tokens = await refreshTokens(deviceId, refreshToken);
  return res.send_ok('Tokens refreshed successfully', tokens);
});

authRouter.delete('/logout', async (req, res) => {
  const deviceId = retrieveDeviceId(req);
  const refreshToken = retrieveHeaderInfo(req);
  await logout(deviceId, refreshToken);
  return res.send_noContent('User logged out');
});

// google oauth2 login
authRouter.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  }),
);

authRouter.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/auth/google' }),
  async (req, res) => {
    // req.user is set by Passport
    if ((req.user as IGoogleUser).isNewUser) return res.send_ok('Google callback successfully', req.user);

    const deviceId = retrieveDeviceId(req);
    const tokens = await googleCallbackHandler(req.user as IUser, deviceId);
    return res.send_ok('Google callback successfully', tokens);
  },
);

export default authRouter;
