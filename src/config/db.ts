import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  await mongoose.connect(process.env.MONGO_URI as string);
  console.log('DB connected');
};

export default connectDB;