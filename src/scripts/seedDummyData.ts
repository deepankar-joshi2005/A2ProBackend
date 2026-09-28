import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Member from "../models/member.model.js";
import MembershipPlan from "../models/membershipPlan.model.js";
import PTPlan from "../models/ptPlan.model.js";
import DietPlan from "../models/dietPlan.model.js";
import WorkoutPlan from "../models/workoutPlan.model.js";
import MemberPTPlan from "../models/memberPtPlan.model.js";
import MemberDietPlan from "../models/memberDietPlan.model.js";
import MemberWorkoutPlan from "../models/memberWorkoutPlan.model.js";
import Payment from "../models/payment.model.js";
import Batch from "../models/batch.model.js";

dotenv.config();

// Helper: Add days to a date
function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// Helper: Subtract days from today
function daysAgo(days: number): Date {
  return addDays(new Date(), -days);
}

// Today
const today = new Date();
today.setHours(0, 0, 0, 0);

// Tomorrow
const tomorrow = addDays(today, 1);

async function seedDummyData() {
  await connectDB();
  console.log("\n🌱 Starting dummy data seed...\n");

  // ─────────────────────────────────────────────
  // 1. BATCHES
  // ─────────────────────────────────────────────
  const batchData = [
    { name: "Morning Batch", limit: 30, openTime: "06:00", closeTime: "08:00" },
    { name: "Evening Batch", limit: 30, openTime: "17:00", closeTime: "19:00" },
  ];
  const batches: any[] = [];
  for (const b of batchData) {
    const batch = await Batch.findOneAndUpdate(
      { name: b.name },
      { $set: { ...b, isActive: true } },
      { upsert: true, new: true }
    );
    batches.push(batch);
  }
  console.log(`✅ Batches seeded: ${batches.map((b) => b.name).join(", ")}`);

  // ─────────────────────────────────────────────
  // 2. MEMBERSHIP PLANS
  // ─────────────────────────────────────────────
  const membershipPlansData = [
    { name: "Monthly Plan", amount: 1200, durationUnit: "months", durationValue: 1, durationInDays: 30 },
    { name: "Quarterly Plan", amount: 3200, durationUnit: "months", durationValue: 3, durationInDays: 90 },
    { name: "Half-Yearly Plan", amount: 6000, durationUnit: "months", durationValue: 6, durationInDays: 180 },
    { name: "Yearly Plan", amount: 11000, durationUnit: "months", durationValue: 12, durationInDays: 365 },
    { name: "15 Days Plan", amount: 700, durationUnit: "days", durationValue: 15, durationInDays: 15 },
    { name: "Weekly Plan", amount: 350, durationUnit: "days", durationValue: 7, durationInDays: 7 },
  ];
  const membershipPlans: any[] = [];
  for (const p of membershipPlansData) {
    const plan = await MembershipPlan.findOneAndUpdate(
      { name: p.name },
      { $set: { ...p, isActive: true } },
      { upsert: true, new: true }
    );
    membershipPlans.push(plan);
  }
  console.log(`✅ Membership Plans seeded: ${membershipPlans.map((p) => p.name).join(", ")}`);

  // ─────────────────────────────────────────────
  // 3. PT PLANS
  // ─────────────────────────────────────────────
  const ptPlansData = [
    { name: "PT - 1 Month (12 Sessions)", amount: 3000, isSessionBased: true, sessions: 12, durationUnit: "months", durationValue: 1, durationInDays: 30 },
    { name: "PT - 3 Months (36 Sessions)", amount: 8000, isSessionBased: true, sessions: 36, durationUnit: "months", durationValue: 3, durationInDays: 90 },
    { name: "PT - Monthly Unlimited", amount: 5000, isSessionBased: false, sessions: 0, durationUnit: "months", durationValue: 1, durationInDays: 30 },
    { name: "PT - 6 Months Package", amount: 14000, isSessionBased: false, sessions: 0, durationUnit: "months", durationValue: 6, durationInDays: 180 },
  ];
  const ptPlans: any[] = [];
  for (const p of ptPlansData) {
    const plan = await PTPlan.findOneAndUpdate(
      { name: p.name },
      { $set: { ...p, isActive: true } },
      { upsert: true, new: true }
    );
    ptPlans.push(plan);
  }
  console.log(`✅ PT Plans seeded: ${ptPlans.map((p) => p.name).join(", ")}`);

  // ─────────────────────────────────────────────
  // 4. DIET PLANS
  // ─────────────────────────────────────────────
  const dietPlansData = [
    {
      name: "Weight Loss Diet",
      notes: "Low calorie, high protein plan for weight loss",
      days: [
        {
          title: "Day 1 - Monday",
          meals: [
            { name: "Oats with milk", quantity: "1 bowl", calories: "300", notes: "No sugar" },
            { name: "Boiled eggs", quantity: "3 eggs", calories: "210", notes: "Remove yolk for 1" },
            { name: "Grilled chicken", quantity: "150g", calories: "250", notes: "Dinner" },
          ],
        },
        {
          title: "Day 2 - Tuesday",
          meals: [
            { name: "Poha", quantity: "1 bowl", calories: "250", notes: "Breakfast" },
            { name: "Dal + Rice", quantity: "1 plate", calories: "400", notes: "Lunch" },
            { name: "Salad", quantity: "1 bowl", calories: "100", notes: "Dinner" },
          ],
        },
      ],
    },
    {
      name: "Muscle Gain Diet",
      notes: "High protein, high calorie plan for muscle building",
      days: [
        {
          title: "Day 1 - Monday",
          meals: [
            { name: "Paneer Paratha", quantity: "2 pieces", calories: "450", notes: "Breakfast" },
            { name: "Protein Shake", quantity: "1 scoop", calories: "150", notes: "Post workout" },
            { name: "Chicken + Rice", quantity: "200g + 1 cup", calories: "600", notes: "Lunch" },
            { name: "Milk + Banana", quantity: "1 glass + 1", calories: "250", notes: "Snack" },
          ],
        },
        {
          title: "Day 2 - Tuesday",
          meals: [
            { name: "Egg Omelette", quantity: "4 eggs", calories: "400", notes: "Breakfast" },
            { name: "Rajma + Roti", quantity: "1 bowl + 3", calories: "550", notes: "Lunch" },
            { name: "Mutton Curry", quantity: "200g", calories: "500", notes: "Dinner" },
          ],
        },
      ],
    },
    {
      name: "Diabetic Friendly Diet",
      notes: "Low GI foods, balanced meals for diabetic members",
      days: [
        {
          title: "Day 1",
          meals: [
            { name: "Brown Bread + Peanut Butter", quantity: "2 slices", calories: "300", notes: "No jam" },
            { name: "Mixed Vegetable Sabzi", quantity: "1 bowl", calories: "150", notes: "Lunch" },
            { name: "Dal Soup", quantity: "1 cup", calories: "120", notes: "Dinner" },
          ],
        },
      ],
    },
  ];
  const dietPlans: any[] = [];
  for (const p of dietPlansData) {
    const plan = await DietPlan.findOneAndUpdate(
      { name: p.name },
      { $set: { ...p, isActive: true } },
      { upsert: true, new: true }
    );
    dietPlans.push(plan);
  }
  console.log(`✅ Diet Plans seeded: ${dietPlans.map((p) => p.name).join(", ")}`);

  // ─────────────────────────────────────────────
  // 5. WORKOUT PLANS
  // ─────────────────────────────────────────────
  const workoutPlansData = [
    {
      name: "Beginner Full Body",
      notes: "3 days a week full body workout for beginners",
      days: [
        {
          title: "Day 1 - Chest & Triceps",
          exercises: [
            { name: "Push Ups", sets: "3", reps: "15", rest: "60s", notes: "Warm up" },
            { name: "Bench Press", sets: "4", reps: "10", rest: "90s", notes: "" },
            { name: "Tricep Dips", sets: "3", reps: "12", rest: "60s", notes: "" },
          ],
        },
        {
          title: "Day 2 - Back & Biceps",
          exercises: [
            { name: "Pull Ups", sets: "3", reps: "8", rest: "90s", notes: "Assisted if needed" },
            { name: "Barbell Row", sets: "4", reps: "10", rest: "90s", notes: "" },
            { name: "Bicep Curl", sets: "3", reps: "12", rest: "60s", notes: "" },
          ],
        },
        {
          title: "Day 3 - Legs",
          exercises: [
            { name: "Squats", sets: "4", reps: "12", rest: "90s", notes: "" },
            { name: "Leg Press", sets: "3", reps: "15", rest: "60s", notes: "" },
            { name: "Calf Raises", sets: "3", reps: "20", rest: "45s", notes: "" },
          ],
        },
      ],
    },
    {
      name: "Advanced Strength Program",
      notes: "5 day split for advanced members",
      days: [
        {
          title: "Day 1 - Heavy Chest",
          exercises: [
            { name: "Incline Bench Press", sets: "5", reps: "5", rest: "3min", notes: "Heavy" },
            { name: "Flat Bench Press", sets: "4", reps: "8", rest: "2min", notes: "" },
            { name: "Cable Fly", sets: "3", reps: "12", rest: "90s", notes: "" },
          ],
        },
        {
          title: "Day 2 - Deadlift Day",
          exercises: [
            { name: "Deadlift", sets: "5", reps: "3", rest: "4min", notes: "Max effort" },
            { name: "Romanian Deadlift", sets: "3", reps: "8", rest: "2min", notes: "" },
          ],
        },
      ],
    },
    {
      name: "Cardio & Flexibility",
      notes: "Cardio focused plan with stretching",
      days: [
        {
          title: "Day 1 - Cardio",
          exercises: [
            { name: "Treadmill", sets: "1", reps: "30 min", rest: "0", notes: "Moderate pace" },
            { name: "Jump Rope", sets: "5", reps: "2 min", rest: "30s", notes: "" },
          ],
        },
        {
          title: "Day 2 - Flexibility",
          exercises: [
            { name: "Yoga Stretches", sets: "1", reps: "20 min", rest: "0", notes: "" },
            { name: "Foam Rolling", sets: "1", reps: "10 min", rest: "0", notes: "" },
          ],
        },
      ],
    },
  ];
  const workoutPlans: any[] = [];
  for (const p of workoutPlansData) {
    const plan = await WorkoutPlan.findOneAndUpdate(
      { name: p.name },
      { $set: { ...p, isActive: true } },
      { upsert: true, new: true }
    );
    workoutPlans.push(plan);
  }
  console.log(`✅ Workout Plans seeded: ${workoutPlans.map((p) => p.name).join(", ")}`);

  // ─────────────────────────────────────────────
  // 6. MEMBERS with strategic expiry dates
  // ─────────────────────────────────────────────
  // monthlyPlan = membershipPlans[0] (30 days)
  // quarterlyPlan = membershipPlans[1] (90 days)
  const monthlyPlan = membershipPlans[0];
  const quarterlyPlan = membershipPlans[1];
  const halfYearlyPlan = membershipPlans[2];
  const yearlyPlan = membershipPlans[3];
  const weeklyPlan = membershipPlans[5];

  /**
   * MEMBER STRATEGY:
   * - Raj Sharma     → Expiry in 2 days  (membership filter test - expiring soon)
   * - Priya Singh    → Expiry in 1 day   (membership filter test - expiring tomorrow)
   * - Amit Patel     → Expiry in 4 days  (membership filter test)
   * - Sunita Verma   → Expiry in 10 days (not in critical zone)
   * - Vikram Malhotra→ Expired already (3 days ago) - to test expired filter
   * - Kavya Reddy    → Birthday TODAY
   * - Rajan Nair     → Birthday TOMORROW
   */

  const membersData = [
    {
      name: "Raj Sharma",
      gender: "male",
      mobile: "9876543201",
      email: "raj.sharma@example.com",
      membershipId: "GYM-2024-001",
      batchLabel: "Morning Batch",
      planId: monthlyPlan._id,
      planAmount: monthlyPlan.amount,
      joiningDate: daysAgo(28),
      paymentDate: daysAgo(28),
      planExpiryDate: addDays(today, 2),  // Expires in 2 days ⚡
      paidAmount: monthlyPlan.amount,
      dueAmount: 0,
      paymentMethod: "Cash",
      dob: new Date("1992-08-15"),
      address: "123, MG Road, Mumbai",
    },
    {
      name: "Priya Singh",
      gender: "female",
      mobile: "9876543202",
      email: "priya.singh@example.com",
      membershipId: "GYM-2024-002",
      batchLabel: "Evening Batch",
      planId: weeklyPlan._id,
      planAmount: weeklyPlan.amount,
      joiningDate: daysAgo(6),
      paymentDate: daysAgo(6),
      planExpiryDate: addDays(today, 1),  // Expires TOMORROW ⚡
      paidAmount: weeklyPlan.amount,
      dueAmount: 0,
      paymentMethod: "UPI",
      dob: new Date(today.getFullYear(), today.getMonth(), today.getDate()), // Birthday TODAY 🎂
      address: "45, Park Street, Delhi",
    },
    {
      name: "Amit Patel",
      gender: "male",
      mobile: "9876543203",
      email: "amit.patel@example.com",
      membershipId: "GYM-2024-003",
      batchLabel: "Morning Batch",
      planId: monthlyPlan._id,
      planAmount: monthlyPlan.amount,
      joiningDate: daysAgo(26),
      paymentDate: daysAgo(26),
      planExpiryDate: addDays(today, 4),  // Expires in 4 days ⚡
      paidAmount: monthlyPlan.amount,
      dueAmount: 0,
      paymentMethod: "Card",
      dob: new Date("1990-03-22"),
      address: "78, Ring Road, Ahmedabad",
    },
    {
      name: "Sunita Verma",
      gender: "female",
      mobile: "9876543204",
      email: "sunita.verma@example.com",
      membershipId: "GYM-2024-004",
      batchLabel: "Evening Batch",
      planId: quarterlyPlan._id,
      planAmount: quarterlyPlan.amount,
      joiningDate: daysAgo(80),
      paymentDate: daysAgo(80),
      planExpiryDate: addDays(today, 10),  // Expires in 10 days
      paidAmount: quarterlyPlan.amount,
      dueAmount: 0,
      paymentMethod: "UPI",
      dob: new Date("1995-11-10"),
      address: "90, Civil Lines, Jaipur",
    },
    {
      name: "Vikram Malhotra",
      gender: "male",
      mobile: "9876543205",
      email: "vikram.malhotra@example.com",
      membershipId: "GYM-2024-005",
      batchLabel: "Morning Batch",
      planId: monthlyPlan._id,
      planAmount: monthlyPlan.amount,
      joiningDate: daysAgo(33),
      paymentDate: daysAgo(33),
      planExpiryDate: addDays(today, -3),  // ALREADY EXPIRED (3 days ago) ❌
      paidAmount: 800,
      dueAmount: 400,  // Due amount pending
      paymentMethod: "Cash",
      dob: new Date("1988-06-30"),
      address: "12, Sector 17, Chandigarh",
    },
    {
      name: "Kavya Reddy",
      gender: "female",
      mobile: "9876543206",
      email: "kavya.reddy@example.com",
      membershipId: "GYM-2024-006",
      batchLabel: "Morning Batch",
      planId: halfYearlyPlan._id,
      planAmount: halfYearlyPlan.amount,
      joiningDate: daysAgo(45),
      paymentDate: daysAgo(45),
      planExpiryDate: addDays(today, 135),  // Active - expires in 135 days
      paidAmount: halfYearlyPlan.amount,
      dueAmount: 0,
      paymentMethod: "Bank Transfer",
      // Birthday TODAY 🎂
      dob: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      address: "56, Jubilee Hills, Hyderabad",
    },
    {
      name: "Rajan Nair",
      gender: "male",
      mobile: "9876543207",
      email: "rajan.nair@example.com",
      membershipId: "GYM-2024-007",
      batchLabel: "Evening Batch",
      planId: yearlyPlan._id,
      planAmount: yearlyPlan.amount,
      joiningDate: daysAgo(60),
      paymentDate: daysAgo(60),
      planExpiryDate: addDays(today, 305),  // Active - expires in 305 days
      paidAmount: yearlyPlan.amount,
      dueAmount: 0,
      paymentMethod: "UPI",
      // Birthday TOMORROW 🎂
      dob: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate()),
      address: "34, Koramangala, Bangalore",
    },
  ];

  const members: any[] = [];
  for (const m of membersData) {
    const member = await Member.findOneAndUpdate(
      { email: m.email },
      {
        $set: {
          ...m,
          countryCode: "+91",
          isFrozen: false,
          isBlocked: false,
          discountType: "percent",
          discountValue: 0,
          admissionFees: 0,
          notes: "",
          comments: "",
        },
      },
      { upsert: true, new: true }
    );
    members.push(member);
  }
  console.log(`\n✅ Members seeded:`);
  members.forEach((m) => {
    const expiry = m.planExpiryDate ? new Date(m.planExpiryDate).toDateString() : "N/A";
    const dob = m.dob ? new Date(m.dob).toDateString() : "N/A";
    console.log(`   - ${m.name} | Expiry: ${expiry} | DOB: ${dob}`);
  });

  // ─────────────────────────────────────────────
  // 7. PAYMENTS for each member
  // ─────────────────────────────────────────────
  let invoiceCounter = 1001;
  for (let i = 0; i < members.length; i++) {
    const m = members[i];
    const md = membersData[i];
    if (md.paidAmount > 0) {
      await Payment.findOneAndUpdate(
        { memberId: m._id, invoiceNumber: `INV-${invoiceCounter}` },
        {
          $set: {
            memberId: m._id,
            amount: md.paidAmount,
            method: md.paymentMethod,
            date: md.paymentDate,
            invoiceNumber: `INV-${invoiceCounter}`,
          },
        },
        { upsert: true, new: true }
      );
      invoiceCounter++;
    }
  }
  console.log(`\n✅ Payments seeded for all members`);

  // ─────────────────────────────────────────────
  // 8. ASSIGN PT PLANS to some members (with due/expiry scenarios)
  // ─────────────────────────────────────────────
  // Raj Sharma → PT plan expiring in 3 days
  // Amit Patel → PT plan expiring in 1 day
  // Sunita Verma → PT plan already expired 5 days ago

  const ptAssignments = [
    {
      member: members[0], // Raj Sharma
      ptPlan: ptPlans[0], // PT - 1 Month
      startDate: daysAgo(27),
      expiryDate: addDays(today, 3),  // PT expiry in 3 days ⚡
    },
    {
      member: members[2], // Amit Patel
      ptPlan: ptPlans[2], // PT - Monthly Unlimited
      startDate: daysAgo(29),
      expiryDate: addDays(today, 1),  // PT expiry TOMORROW ⚡
    },
    {
      member: members[3], // Sunita Verma
      ptPlan: ptPlans[1], // PT - 3 Months
      startDate: daysAgo(95),
      expiryDate: addDays(today, -5),  // PT ALREADY EXPIRED ❌
    },
    {
      member: members[6], // Rajan Nair
      ptPlan: ptPlans[3], // PT - 6 Months
      startDate: daysAgo(60),
      expiryDate: addDays(today, 120),  // PT Active, expires in 120 days
    },
  ];

  for (const pa of ptAssignments) {
    await MemberPTPlan.findOneAndUpdate(
      { memberId: pa.member._id, ptPlanId: pa.ptPlan._id },
      {
        $set: {
          memberId: pa.member._id,
          ptPlanId: pa.ptPlan._id,
          startDate: pa.startDate,
          expiryDate: pa.expiryDate,
          isFrozen: false,
        },
      },
      { upsert: true, new: true }
    );
  }
  console.log(`\n✅ PT Plans assigned:`);
  ptAssignments.forEach((pa) => {
    console.log(`   - ${pa.member.name} → ${pa.ptPlan.name} | Expiry: ${pa.expiryDate.toDateString()}`);
  });

  // ─────────────────────────────────────────────
  // 9. ASSIGN DIET PLANS to some members
  // ─────────────────────────────────────────────
  const dietAssignments = [
    { member: members[0], dietPlan: dietPlans[1] },  // Raj → Muscle Gain
    { member: members[1], dietPlan: dietPlans[0] },  // Priya → Weight Loss
    { member: members[2], dietPlan: dietPlans[1] },  // Amit → Muscle Gain
    { member: members[3], dietPlan: dietPlans[2] },  // Sunita → Diabetic Friendly
    { member: members[5], dietPlan: dietPlans[0] },  // Kavya → Weight Loss
  ];

  for (const da of dietAssignments) {
    await MemberDietPlan.findOneAndUpdate(
      { memberId: da.member._id, planId: da.dietPlan._id },
      {
        $set: {
          memberId: da.member._id,
          planId: da.dietPlan._id,
          assignedDate: new Date(),
        },
      },
      { upsert: true, new: true }
    );
  }
  console.log(`\n✅ Diet Plans assigned:`);
  dietAssignments.forEach((da) => {
    console.log(`   - ${da.member.name} → ${da.dietPlan.name}`);
  });

  // ─────────────────────────────────────────────
  // 10. ASSIGN WORKOUT PLANS to some members
  // ─────────────────────────────────────────────
  const workoutAssignments = [
    { member: members[0], workoutPlan: workoutPlans[1] },  // Raj → Advanced Strength
    { member: members[1], workoutPlan: workoutPlans[2] },  // Priya → Cardio & Flexibility
    { member: members[2], workoutPlan: workoutPlans[1] },  // Amit → Advanced Strength
    { member: members[3], workoutPlan: workoutPlans[0] },  // Sunita → Beginner Full Body
    { member: members[4], workoutPlan: workoutPlans[0] },  // Vikram → Beginner Full Body
    { member: members[6], workoutPlan: workoutPlans[1] },  // Rajan → Advanced Strength
  ];

  for (const wa of workoutAssignments) {
    await MemberWorkoutPlan.findOneAndUpdate(
      { memberId: wa.member._id, planId: wa.workoutPlan._id },
      {
        $set: {
          memberId: wa.member._id,
          planId: wa.workoutPlan._id,
          assignedDate: new Date(),
        },
      },
      { upsert: true, new: true }
    );
  }
  console.log(`\n✅ Workout Plans assigned:`);
  workoutAssignments.forEach((wa) => {
    console.log(`   - ${wa.member.name} → ${wa.workoutPlan.name}`);
  });

  // ─────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 SEED COMPLETE - TEST SCENARIOS SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 MEMBERSHIP EXPIRY FILTERS:
   • Priya Singh      → Expires in 1 day  (${addDays(today, 1).toDateString()})
   • Raj Sharma       → Expires in 2 days  (${addDays(today, 2).toDateString()})
   • Amit Patel       → Expires in 4 days  (${addDays(today, 4).toDateString()})
   • Sunita Verma     → Expires in 10 days (${addDays(today, 10).toDateString()})
   • Vikram Malhotra  → ALREADY EXPIRED    (${addDays(today, -3).toDateString()})

🎂 BIRTHDAY ALERTS:
   • Priya Singh      → Birthday TODAY     (${today.toDateString()})
   • Kavya Reddy      → Birthday TODAY     (${today.toDateString()})
   • Rajan Nair       → Birthday TOMORROW  (${tomorrow.toDateString()})

🏋️ PT PLAN EXPIRY:
   • Amit Patel       → PT expires in 1 day
   • Raj Sharma       → PT expires in 3 days
   • Sunita Verma     → PT ALREADY EXPIRED
   • Rajan Nair       → PT expires in 120 days (active)

💰 DUE AMOUNT:
   • Vikram Malhotra  → ₹400 due

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

  await mongoose.disconnect();
  process.exit(0);
}

seedDummyData().catch((err) => {
  console.error("❌ Seed error:", err);
  process.exit(1);
});
