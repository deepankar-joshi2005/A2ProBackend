import mongoose from "mongoose";
import Member from "../models/member.model.js";

const connectDB = async (): Promise<void> => {
  try {
    const uri = process.env.MONGO_URI as string;
    await mongoose.connect(uri);
    console.log("MongoDB connected");
    // Rebuilds the email index as unique+sparse so members can be saved without an email.
    await Member.syncIndexes();
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

export default connectDB;