import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import connectDB from "../config/db.js";
import User from "../models/user.model.js";
import MembershipPlan from "../models/membershipPlan.model.js";

dotenv.config();

const DEFAULT_PLANS = [
  { name: "Monthly Plan", amount: 1200, durationInDays: 30 },
  { name: "Quarterly Plan", amount: 3200, durationInDays: 90 },
  { name: "Half-Yearly Plan", amount: 6000, durationInDays: 180 },
  { name: "Yearly Plan", amount: 11000, durationInDays: 365 },
];

async function seed() {
  await connectDB();

  const hashed = await bcrypt.hash("123456", 10);
  await User.findOneAndUpdate(
    { email: "admin@gmail.com" },
    { $setOnInsert: { name: "Admin", email: "admin@gmail.com", password: hashed, role: "admin" } },
    { upsert: true, returnDocument: "after" }
  );
  console.log("Admin user ensured (admin@gmail.com / 123456)");

  for (const plan of DEFAULT_PLANS) {
    await MembershipPlan.findOneAndUpdate(
      { name: plan.name },
      { $set: { amount: plan.amount, durationInDays: plan.durationInDays, isActive: true } },
      { upsert: true, returnDocument: "after" }
    );
  }
  console.log(`Seeded ${DEFAULT_PLANS.length} membership plans`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
