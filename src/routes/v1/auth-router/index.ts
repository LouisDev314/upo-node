import express from 'express';
import { loginBodyValidation, registerBodyValidation } from '../../../middleware/auth/user-body-validation';
import { login, register } from '../../../services/auth';

const authRouter = express.Router();

authRouter.post('/register', registerBodyValidation, async (req, res) => {
  await register(req.body);
  // TODO: login
  return res.send_ok('Logged in successfully');
});

authRouter.post('/login', loginBodyValidation, async (req, res) => {
  const token = await login(req.body);
  return res.send_ok('Logged in successfully', token);
});

export default authRouter;
