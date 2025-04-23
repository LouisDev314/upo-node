import { ErrorRequestHandler } from 'express';
import Exception from '../errors/Exception';
import { HttpStatusCode } from 'axios';
import logger from '../services/logger';

// WARNING: Do not delete next in request param
// eslint-disable-next-line
const exceptionHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof Exception) {
    switch (err.code) {
      case HttpStatusCode.BadRequest:
        res.send_badRequest(err.msg, err.data);
        break;
      case HttpStatusCode.Unauthorized:
        res.send_unauthorized(err.msg, err.data);
        break;
      case HttpStatusCode.Forbidden:
        res.send_forbidden(err.msg, err.data);
        break;
      case HttpStatusCode.Conflict:
        res.send_conflict(err.msg, err.data);
        break;
      case HttpStatusCode.UnprocessableEntity:
        res.send_unprocessableEntity(err.msg, err.data);
        break;
      case HttpStatusCode.TooManyRequests:
        res.send_tooManyRequests(err.msg, err.data);
        break;
      default:
        logger.error(err.msg, err.data);
        res.send_internalServerError(err.msg, err.data);
        break;
    }
  } else {
    logger.error('Unhandled error', err);
    res.send_internalServerError('Unhandled error', err);
  }
};

export default exceptionHandler;
