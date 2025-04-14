import { connect, disconnect } from 'mongoose';
import { getEnvConfig } from '../../config/env';

const connectUrl =
    getEnvConfig().mongodbUrl ||
    `mongodb+srv://${getEnvConfig().mongodbUsername}:${getEnvConfig().mongodbPassword}@${getEnvConfig().mongodbHost}/${getEnvConfig().env}`;

export const mongoInit = async () => {
  try {
    const mongoose = await connect(connectUrl, {
      autoCreate: false,
      maxIdleTimeMS: 10000,
      maxPoolSize: getEnvConfig().mongodbPoolSize,
    });
    console.log('Connected to MongoDB');
    return mongoose.connection.db;
  } catch (err) {
    console.error('Connection to MongoDB failed', { url: connectUrl, err });
    throw err;
  }
};

export const mongoStop = async () => {
  await disconnect();
  console.log('Disconnected from MongoDB ');
};