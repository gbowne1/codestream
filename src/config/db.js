import mongoose from 'mongoose';

export const connectDB = async () => {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.warn('⚠️ MONGODB_URI not defined. Running in mock mode.');
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🟢 MongoDB connected successfully');
  } catch (err) {
    console.error('🔴 MongoDB connection error:', err.message);
    process.exit(1); // Exit if DB connection fails
  }
};
