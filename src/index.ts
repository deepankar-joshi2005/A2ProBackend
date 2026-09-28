import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import memberRoutes from "./routes/member.routes.js";
import planRoutes from "./routes/plan.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import reportRoutes from "./routes/report.routes.js";
import expenseRoutes from "./routes/expense.routes.js";
import serviceRoutes from "./routes/service.routes.js";
import ptPlanRoutes from "./routes/ptPlan.routes.js";
import servicePlanRoutes from "./routes/servicePlan.routes.js";
import batchRoutes from "./routes/batch.routes.js";
import workoutPlanRoutes from "./routes/workoutPlan.routes.js";
import dietPlanRoutes from "./routes/dietPlan.routes.js";
import teamMemberRoutes from "./routes/teamMember.routes.js";
import businessProfileRoutes from "./routes/businessProfile.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/pt-plans", ptPlanRoutes);
app.use("/api/service-plans", servicePlanRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/workout-plans", workoutPlanRoutes);
app.use("/api/diet-plans", dietPlanRoutes);
app.use("/api/team-members", teamMemberRoutes);
app.use("/api/business-profile", businessProfileRoutes);

app.get("/", (_req, res) => {
  res.json({ message: "A2ProFitnes Backend is running!" });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});