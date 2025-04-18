import express from 'express';
import cors from 'cors';
// import passport from 'passport';
import responser from 'responser';
import morgan from 'morgan';
import { Server } from 'http';
import logger from './services/logger';
import { mongoInit, mongoStop } from './services/mongodb';
import { getRedisInstance, redisInit, redisStop } from './services/redis';
import './entities'; // call extendZod
import rootRouter from './routes';
import { getEnvConfig } from './config/env';
import exceptionHandler from './middleware/exception-handler';
import { initWithCluster } from './services/cluster';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

/* -------------------------Setup variables------------------------- */
const { port } = getEnvConfig();
const app = express();
let server: Server;

/* -------------------------Setup Express middleware------------------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
if (getEnvConfig().nodeEnv !== 'prod') {
  app.use(
    morgan('dev', {
      skip: (req) => req.url.includes('/health'),
    }),
  );
}
app.use(cors()); // TODO: set up cors options: app.use(cors(corsOptions));
app.use(helmet()); // Enable security headers
// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: 'draft-8', // Use IETF RateLimit header
  legacyHeaders: false, // Disable X-RateLimit-* headers
  message: 'Too many requests, please try again later.', // default HTTP status code is 429 after limit is reached
});
app.use(limiter);
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
      logger.info(`${process.pid} started at port ${port}`);
    });
  } catch (err) {
    console.error(`${process.pid} failed to init server`, err);
    throw err;
  }
};

/* -------------------------Graceful Shutdown------------------------- */
const shutdown = async () => {
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
    logger.info(`${process.pid} down successfully`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

/* -------------------------Cluster------------------------- */
initWithCluster(init, shutdown, getEnvConfig().numWorkers);
