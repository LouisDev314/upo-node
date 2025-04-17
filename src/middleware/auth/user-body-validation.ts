import { UserZod } from '../../entities/user';
import { z } from 'zod';
import Exception from '../../errors/Exception';
import { HttpStatusCode } from 'axios';
import { RequestHandler } from 'express';

export const registerBodyValidation: RequestHandler = (req, res, next) => {
  const RegisterSchema = UserZod.pick({
    username: true,
    email: true,
    password: true,
  });
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) throw new Exception(HttpStatusCode.BadRequest, 'Invalid register body', { errors: parsed.error.errors });
  req.body = parsed.data;
  next();
};

export const loginBodyValidation: RequestHandler = (req, res, next) => {
  const LoginSchema = z.union([
    UserZod.pick({ username: true, password: true }),
    UserZod.pick({ email: true, password: true }),
  ]);
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) throw new Exception(HttpStatusCode.BadRequest, 'Invalid login body', Object(parsed.error.errors));
  next();
};
