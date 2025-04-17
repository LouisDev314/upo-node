import { connect, disconnect } from 'mongoose';
import { getEnvConfig } from '../../config/env';
import logger from '../logger';

const connectUrl = getEnvConfig().mongodbUrl;

export const mongoInit = async () => {
  try {
    const mongoose = await connect(connectUrl, {
      autoCreate: false,
      serverSelectionTimeoutMS: 5000,
      maxIdleTimeMS: 10000,
      maxPoolSize: getEnvConfig().mongodbPoolSize,
    });
    logger.info(`${process.pid} connected to MongoDB`);
    return mongoose.connection.db;
  } catch (err) {
    logger.error(`${process.pid} connection to MongoDB failed`, { url: connectUrl, err });
    throw err;
  }
};

export const mongoStop = async () => {
  await disconnect();
  logger.info(`${process.pid} disconnected from MongoDB `);
};
