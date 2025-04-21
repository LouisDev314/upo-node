import { Request } from 'express';
import Exception from '../errors/Exception';
import { HttpStatusCode } from 'axios';

const retrieveToken = (req: Request) => {
  const authorization = req.headers.authorization || req.headers.Authorization;
  if (!authorization) throw new Exception(HttpStatusCode.Unauthorized, 'Authorization required');

  // Regex to match "Bearer <token>", case-insensitive, and trim whitespace
  const match = authorization.toString().match(/^Bearer\s+(.+)$/i);
  if (!match) throw new Exception(HttpStatusCode.Unauthorized, 'Bearer token required');

  return match[1].trim();
};

export default retrieveToken;
