import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import connectDB from "../config/db.js";
import User from "../models/user.model.js";
import Member from "../models/member.model.js";
import MembershipPlan from "../models/membershipPlan.model.js";

dotenv.config();

async function run() {
  await connectDB();

  const targetEmail = "jagdesh@gmail.com";
  const rawPassword = "123456";
  const hashed = await bcrypt.hash(rawPassword, 10);

  // 1. Create or update User
  let user = await User.findOne({ email: targetEmail });
  if (user) {
    user.password = hashed;
    user.role = "user";
    await user.save();
    console.log(`Updated User password for ${targetEmail}`);
  } else {
    user = await User.create({
      name: "Jagdesh",
      email: targetEmail,
      password: hashed,
      role: "user",
    });
    console.log(`Created User account for ${targetEmail}`);
  }

  // 2. Find Jagdish member in Member model
  let member = await Member.findOne({
    $or: [
      { email: targetEmail },
      { name: new RegExp("jagde", "i") },
      { name: new RegExp("jagdish", "i") },
    ],
  });

  if (member) {
    member.email = targetEmail;
    member.accountUserId = user._id as any;
    await member.save();
    console.log(`Updated Member "${member.name}" with email ${targetEmail} and linked User ID ${user._id}`);
  } else {
    // Get a plan
    let plan = await MembershipPlan.findOne();
    if (!plan) {
      plan = await MembershipPlan.create({
        name: "Monthly Plan",
        amount: 1200,
        durationInDays: 30,
        isActive: true,
      });
    }

    const joiningDate = new Date();
    const planExpiryDate = new Date();
    planExpiryDate.setDate(planExpiryDate.getDate() + 30);

    member = await Member.create({
      name: "Jagdesh",
      gender: "male",
      countryCode: "+91",
      mobile: "9876543210",
      membershipId: "101",
      batchLabel: "Morning 6:00 AM - 7:00 AM",
      planId: plan._id,
      planAmount: plan.amount,
      joiningDate,
      paidAmount: plan.amount,
      paymentMethod: "Cash",
      dueAmount: 0,
      planExpiryDate,
      email: targetEmail,
      accountUserId: user._id as any,
    });
    console.log(`Created new Member "${member.name}" with email ${targetEmail}`);
  }

  console.log("\n✅ SUCCESS! You can now log into the Gym Member Portal with:");
  console.log(`Email: ${targetEmail}`);
  console.log(`Password: ${rawPassword}\n`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Error setting up Jagdesh member:", err);
  process.exit(1);
});
