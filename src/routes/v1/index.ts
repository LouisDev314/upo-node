import { Router } from 'express';
import authRouter from './auth-router';
// import userRouter from './user-router';

const v1Router: Router = Router();

v1Router.use('/auth', authRouter);
// v1Router.use('/user', userRouter);
// v1Router.use('/idea', ideaRouter);

export default v1Router;
