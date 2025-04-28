import { UserZod } from '../../entities/user';
import { z } from 'zod';
import Exception from '../../errors/Exception';
import { HttpStatusCode } from 'axios';
import { RequestHandler } from 'express';

export const emailBodyValidation: RequestHandler = (req, res, next) => {
  const otpSchema = UserZod.pick({
    email: true,
  });
  const parsed = otpSchema.safeParse(req.body);
  if (!parsed.success) throw new Exception(HttpStatusCode.BadRequest, 'Invalid email body', Object(parsed.error.errors));
  req.body = parsed.data;
  next();
};

export const otpBodyValidation: RequestHandler = (req, res, next) => {
  const otpSchema = UserZod.pick({
    email: true,
  }).extend({
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
    googleId: true,
    // TODO: future OAuth type
  }).refine(
    (data) => {
      const isOAuth = data.googleId;
      return isOAuth || !!data.password;
    },
    {
      message: 'Password is required for local registration',
    },
  );
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) throw new Exception(HttpStatusCode.BadRequest, 'Invalid register body', Object(parsed.error.errors));
  req.body = parsed.data;
  next();
};

export const loginBodyValidation: RequestHandler = (req, res, next) => {
  const LoginSchema = z.union([
    UserZod.pick({ username: true, password: true }),
    UserZod.pick({ email: true, password: true }),
  ]);
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) throw new Exception(HttpStatusCode.BadRequest, 'Invalid login/set password body', Object(parsed.error.errors));
  next();
};
