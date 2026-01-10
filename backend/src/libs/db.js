import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_CONNECTION_STRING);
    console.log("Connect database success");
  } catch (error) {
    console.log("Error: ", error);
    process.exit(1);
  }
};
