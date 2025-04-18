import { Request } from 'express';

const retrieveToken = (req: Request): string | undefined => {
  const authorization = req.headers.authorization || req.headers.Authorization;
  if (!authorization) return undefined;

  // Regex to match "Bearer <token>", case-insensitive, and trim whitespace
  const match = authorization.toString().match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : undefined;
};

export default retrieveToken;
