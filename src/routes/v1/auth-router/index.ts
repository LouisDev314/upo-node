import { Router } from 'express';
import {
  deviceIdBodyValidation,
  loginBodyValidation,
  registerBodyValidation,
} from '../../../middleware/auth/user-body-validation';
import { login, logout, refreshTokens, register } from '../../../services/auth';

const authRouter: Router = Router();

authRouter.post('/register', registerBodyValidation, async (req, res) => {
  await register(req.body);
  return res.send_ok('Registered successfully');
});

authRouter.post('/login', loginBodyValidation, async (req, res) => {
  const tokens = await login(req.body);
  return res.send_ok('Logged in successfully', tokens);
});

authRouter.post('/refresh', deviceIdBodyValidation, async (req, res) => {
  const tokens = await refreshTokens(req);
  return res.send_ok('Tokens refreshed successfully', tokens);
});

authRouter.delete('/logout', deviceIdBodyValidation, async (req, res) => {
  await logout(req);
  return res.send_noContent('User logged out');
});

export default authRouter;
