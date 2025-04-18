import { Router } from 'express';
import { loginBodyValidation, registerBodyValidation } from '../../../middleware/auth/user-body-validation';
import { login, register } from '../../../services/auth';

const authRouter: Router = Router();

authRouter.post('/register', registerBodyValidation, async (req, res) => {
  await register(req.body);
  const tokens = await login(req.body);
  return res.send_ok('Logged in successfully', tokens);
});

authRouter.post('/login', loginBodyValidation, async (req, res) => {
  const tokens = await login(req.body);
  return res.send_ok('Logged in successfully', tokens);
});

export default authRouter;
