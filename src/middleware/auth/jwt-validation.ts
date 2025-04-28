import { RequestHandler } from 'express';
import { retrieveHeaderInfo } from '../../utils/retrieve-header-info';
import Exception from '../../errors/Exception';
import { HttpStatusCode } from 'axios';
import jwt from 'jsonwebtoken';
import { getEnvConfig } from '../../config/env';

export const authenticateJWT: RequestHandler = (req, res, next) => {
  try {
    const token = retrieveHeaderInfo(req);
    if (!token) throw new Exception(HttpStatusCode.BadRequest, 'Access token required');

    jwt.verify(token, getEnvConfig().accessSecret);

    next();
  } catch (err) {
    if (err instanceof Error && err.name.includes('Token')) throw new Exception(HttpStatusCode.Unauthorized, 'Invalid token');
    if (err instanceof Exception) throw err;
    throw new Exception(HttpStatusCode.InternalServerError, 'Unable to verify access token', { err });
  }
};
