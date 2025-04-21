import { Router } from 'express';
import {
  deviceIdBodyValidation,
  loginBodyValidation,
  otpBodyValidation,
  registerCompleteBodyValidation,
  registerInitBodyValidation,
} from '../../../middleware/auth/user-body-validation';
import { login, logout, refreshTokens, register, verifyEmail } from '../../../services/auth';
import { IUser } from '../../../entities/user';
import retrieveToken from '../../../utils/retrieve-token';
import { verifyOTP } from '../../../services/smtp/otp';

const authRouter: Router = Router();

authRouter.post('/register/init', registerInitBodyValidation, async (req, res) => {
  const { email } = req.body as Pick<IUser, 'email'>;
  await verifyEmail(email);
  return res.send_ok('OTP sent to email');
});

authRouter.post('/register/verify-otp', otpBodyValidation, async (req, res) => {
  const { email, otp } = req.body as Pick<IUser, 'email'> & { otp: string };
  await verifyOTP(email, otp);
  return res.send_ok('OTP verified');
});

authRouter.post('/register/complete', registerCompleteBodyValidation, async (req, res) => {
  const { username, email, password } = req.body as Pick<IUser, 'username' | 'email' | 'password'>;
  await register(username, email, password);
  return res.send_ok('Registered successfully');
});

// local login
authRouter.post('/login', loginBodyValidation, async (req, res) => {
  const { username, email, password, deviceId } = req.body as Pick<IUser, 'username' | 'email' | 'password'> & {
    deviceId: string;
  };
  const tokens = await login(username, email, password, deviceId);
  return res.send_ok('Logged in successfully', tokens);
});

authRouter.post('/refresh', deviceIdBodyValidation, async (req, res) => {
  const { deviceId } = req.body as { deviceId: string };
  const refreshToken = retrieveToken(req);
  const tokens = await refreshTokens(deviceId, refreshToken);
  return res.send_ok('Tokens refreshed successfully', tokens);
});

authRouter.delete('/logout', deviceIdBodyValidation, async (req, res) => {
  const { deviceId } = req.body as { deviceId: string };
  const refreshToken = retrieveToken(req);
  await logout(deviceId, refreshToken);
  return res.send_noContent('User logged out');
});

export default authRouter;
