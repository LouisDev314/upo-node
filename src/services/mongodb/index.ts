import { connect, disconnect } from 'mongoose';
import { getEnvConfig } from '../../config/env';
import logger from '../logger';

const connectUrl =
    getEnvConfig().mongodbUrl ||
    `mongodb+srv://${getEnvConfig().mongodbUsername}:${getEnvConfig().mongodbPassword}@${getEnvConfig().mongodbHost}/${getEnvConfig().nodeEnv}`;

export const mongoInit = async () => {
  try {
    const mongoose = await connect(connectUrl, {
      autoCreate: false,
      maxIdleTimeMS: 10000,
      maxPoolSize: getEnvConfig().mongodbPoolSize,
    });
    logger.info('Connected to MongoDB');
    return mongoose.connection.db;
  } catch (err) {
    logger.error('Connection to MongoDB failed', { url: connectUrl, err });
    throw err;
  }
};

export const mongoStop = async () => {
  await disconnect();
  logger.info('Disconnected from MongoDB ');
};