require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

mongoose.set('strictQuery', true);
// Fail fast instead of buffering forever when MongoDB is down. Controllers
// guard against writes while offline, so requests stay responsive.
mongoose.set('bufferCommands', false);

/**
 * Creates/updates every index declared in the Mongoose schemas. Running this at
 * startup keeps the local database in sync with the models (and makes the
 * indexes visible in mongosh/Compass for demos).
 */
const syncModelIndexes = async () => {
  const models = Object.values(mongoose.models);
  if (models.length === 0) return;

  try {
    await Promise.all(models.map((model) => model.syncIndexes()));
    console.log(`MongoDB indexes ready for ${models.length} collections`);
  } catch (error) {
    console.warn(`MongoDB index sync warning: ${error.message}`);
  }
};

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('MongoDB URI is not configured. Document persistence is disabled.');
    return null;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10_000,
      maxPoolSize: 10,
    });
    console.log(`🍃 MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);

    await syncModelIndexes();

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Document persistence is temporarily unavailable.');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected.');
    });

    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.log('Server will continue to run, but database features will be unavailable.');
    return null;
  }
};

const isMongoConnected = () => mongoose.connection.readyState === 1;

const getMongoStatus = () => ({
  connected: isMongoConnected(),
  state: mongoose.STATES[mongoose.connection.readyState] || 'unknown',
  host: mongoose.connection.host || null,
  database: mongoose.connection.name || null,
});

module.exports = connectDB;
module.exports.isMongoConnected = isMongoConnected;
module.exports.getMongoStatus = getMongoStatus;
