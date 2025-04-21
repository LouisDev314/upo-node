import { UserZod } from '../../entities/user';
import { z } from 'zod';
import Exception from '../../errors/Exception';
import { HttpStatusCode } from 'axios';
import { RequestHandler } from 'express';
import retrieveToken from '../../utils/retrieve-token';
import { authenticateAccessToken } from '../../services/auth/jwt';

export const registerInitBodyValidation: RequestHandler = (req, res, next) => {
  const otpSchema = UserZod.pick({
    email: true,
    password: true,
  });
  const parsed = otpSchema.safeParse(req.body);
  if (!parsed.success) throw new Exception(HttpStatusCode.BadRequest, 'Invalid register init body', Object(parsed.error.errors));
  req.body = parsed.data;
  next();
};

export const otpBodyValidation: RequestHandler = (req, res, next) => {
  const otpSchema = z.object({
    otp: z.string().length(6, { message: 'otp is required' }),
  });
  const parsed = otpSchema.safeParse(req.body);
  if (!parsed.success) throw new Exception(HttpStatusCode.BadRequest, 'Invalid otp body', Object(parsed.error.errors));
  next();
};

export const registerCompleteBodyValidation: RequestHandler = (req, res, next) => {
  const RegisterSchema = UserZod.pick({
    username: true,
    email: true,
    password: true,
  });
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) throw new Exception(HttpStatusCode.BadRequest, 'Invalid register body', Object(parsed.error.errors));
  req.body = parsed.data;
  next();
};

export const loginBodyValidation: RequestHandler = (req, res, next) => {
  const deviceIdSchema = z.string().min(1, { message: 'deviceId is required' });

  const LoginSchema = z.union([
    UserZod.pick({ username: true, password: true }).extend({ deviceId: deviceIdSchema }),
    UserZod.pick({ email: true, password: true }).extend({ deviceId: deviceIdSchema }),
  ]);
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) throw new Exception(HttpStatusCode.BadRequest, 'Invalid login body', Object(parsed.error.errors));
  next();
};

export const deviceIdBodyValidation: RequestHandler = (req, res, next) => {
  const deviceIdSchema = z.object({
    deviceId: z.string().min(1, { message: 'deviceId is required' }),
  });
  const parsed = deviceIdSchema.safeParse(req.body);
  if (!parsed.success) throw new Exception(HttpStatusCode.BadRequest, 'Invalid refresh body', Object(parsed.error.errors));
  next();
};

export const accessTokenValidation: RequestHandler = (req, res, next) => {
  const token = retrieveToken(req);
  if (!token) throw new Exception(HttpStatusCode.BadRequest, 'Access token required');

  req.body = authenticateAccessToken(token);
  next();
};
