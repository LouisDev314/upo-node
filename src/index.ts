import express from 'express';
import cors from 'cors';
// import passport from 'passport';
import responser from 'responser';
import morgan from 'morgan';
import { Server } from 'http';
import logger from './services/logger';
import { mongoInit, mongoStop } from './services/mongodb';
import { getRedisInstance, redisInit, redisStop } from './services/redis';

import rootRouter from './routes';
import { getEnvConfig } from './config/env';
import exceptionHandler from './middleware/exception-handler';

/* -------------------------Setup variables------------------------- */
const { port } = getEnvConfig();
const app = express();
let server: Server;

/* -------------------------Setup Express middleware------------------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
if (getEnvConfig().nodeEnv !== 'prod') {
  app.use(morgan('dev', {
    skip: (req) => req.url.includes('/health-check'),
  }));
}
// TODO: set up cors options: app.use(cors(corsOptions));
app.use(cors());
app.use(responser);
// app.use(passport.initialize());

app.use('/api', rootRouter);
app.use(exceptionHandler);

/* -------------------------Init------------------------- */
const applicationBootstrap = async () => {
  await Promise.all([mongoInit(), redisInit()]);
};

const init = async () => {
  try {
    await applicationBootstrap();
    server = app.listen(port, () => {
      logger.info(`Server started at port: ${port}`);
    });
  } catch (err) {
    console.error('Failed to init server', err);
    throw err;
  }
};

const shutdown = async () => {
  logger.info('Received kill signal, shutting down gracefully...');
  try {
    await Promise.race([
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }).then(() => {
        redisStop(getRedisInstance());
        return Promise.all([mongoStop()]);
      }),
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Taking too long to close connection, forcefully shutting down...'));
        }, 10000);
      }),
    ]);
    logger.info('Server down successfully');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

/* -------------------------Graceful Shutdown------------------------- */
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

/* -------------------------Failed Init------------------------- */
init().catch(() => {
  process.abort();
});