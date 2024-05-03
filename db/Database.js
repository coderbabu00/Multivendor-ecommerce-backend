import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
export const connectDatabase = async () => {
  try {
    const mongooseConnection = await mongoose.connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`mongod connected with server: ${mongooseConnection.connection.host}`);
  } catch (error) {
    console.error(error);
  }
};