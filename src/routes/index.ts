import express from 'express';
import v1Router from './v1';

const rootRouter = express.Router();

rootRouter.get('/health', (req, res) => {
  res.send_ok('Healthy', {
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

rootRouter.use('/v1', v1Router);

export default rootRouter;
