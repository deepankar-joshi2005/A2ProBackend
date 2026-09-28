import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import Attendance from "../models/attendance.model.js";
import Member from "../models/member.model.js";
import User from "../models/user.model.js";
import { Expense } from "../models/expense.model.js";
import { GymService } from "../models/service.model.js";

function getTodayStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const punchAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { memberId } = req.body;
    if (!memberId) {
      res.status(400).json({ message: "memberId is required" });
      return;
    }
    const member = await Member.findById(memberId);
    if (!member) {
      res.status(404).json({ message: "Member not found" });
      return;
    }

    const todayStr = getTodayStr();
    let record = await Attendance.findOne({ memberId, dateStr: todayStr });

    if (!record) {
      // Punch In
      record = await Attendance.create({
        memberId,
        dateStr: todayStr,
        punchInTime: new Date(),
        status: "punched_in",
        createdBy: req.userId || null,
      });
      res.status(201).json({ message: "Punched in successfully", record });
    } else if (record.status === "punched_in") {
      // Punch Out
      record.punchOutTime = new Date();
      record.status = "punched_out";
      await record.save();
      res.json({ message: "Punched out successfully", record });
    } else {
      // Already punched out for today, punch in again
      record.punchInTime = new Date();
      record.punchOutTime = null;
      record.status = "punched_in";
      await record.save();
      res.json({ message: "Punched in again successfully", record });
    }
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const getTodayAttendance = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const todayStr = getTodayStr();
    const records = await Attendance.find({ dateStr: todayStr }).populate("memberId");
    res.json({ records });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const getAttendanceReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const dateStr = String(req.query.date || getTodayStr());
    const records = await Attendance.find({ dateStr }).populate({
      path: "memberId",
      populate: { path: "planId" },
    });
    res.json({ dateStr, records });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const getDashboardStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const todayStr = getTodayStr();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // All members
    const allMembers = await Member.find().populate("planId");

    // Today's attendance
    const todayAttendanceCount = await Attendance.countDocuments({ dateStr: todayStr });

    // Today's birthdays
    const birthdaysTodayCount = allMembers.filter((m) => {
      if (!m.dob) return false;
      const d = new Date(m.dob);
      return d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
    }).length;

    // Days calculation helpers
    const MS_PER_DAY = 86400000;
    const nowMs = now.getTime();

    let expiresTodayCount = 0;
    let ptExpiresTodayCount = 0;
    let expiring1to3 = 0;
    let expiring4to7 = 0;
    let expiring8to15 = 0;
    let ptExpiring1to3 = 0;
    let ptExpiring4to7 = 0;
    let ptExpiring8to15 = 0;

    let activeMembers = 0;
    let expiredMembers = 0;
    let totalMembers = allMembers.length;
    let blockMembers = 0;

    let activePTPlans = 0;
    let expiredPTPlans = 0;
    let totalPTPlans = 0;

    allMembers.forEach((m) => {
      const expiryMs = m.planExpiryDate ? new Date(m.planExpiryDate).getTime() : 0;
      const daysLeft = (expiryMs - nowMs) / MS_PER_DAY;
      const isExpired = daysLeft < 0;

      const planName = (m.planId as any)?.name?.toLowerCase() || "";
      const isPTPlan = planName.includes("pt") || planName.includes("personal");

      if (isExpired) {
        expiredMembers++;
      } else {
        activeMembers++;
      }

      if (daysLeft >= 0 && daysLeft <= 1) {
        expiresTodayCount++;
      }
      if (daysLeft > 0 && daysLeft <= 3) expiring1to3++;
      if (daysLeft > 3 && daysLeft <= 7) expiring4to7++;
      if (daysLeft > 7 && daysLeft <= 15) expiring8to15++;

      if (isPTPlan) {
        totalPTPlans++;
        if (isExpired) {
          expiredPTPlans++;
        } else {
          activePTPlans++;
        }
        if (daysLeft >= 0 && daysLeft <= 1) ptExpiresTodayCount++;
        if (daysLeft > 0 && daysLeft <= 3) ptExpiring1to3++;
        if (daysLeft > 3 && daysLeft <= 7) ptExpiring4to7++;
        if (daysLeft > 7 && daysLeft <= 15) ptExpiring8to15++;
      }
    });

    // Monthly attendance calculations
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    const monthlyAttendance = await Attendance.find({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    });

    const monthlyCheckIns = monthlyAttendance.length;
    const uniqueMembersSet = new Set(monthlyAttendance.map((a) => String(a.memberId)));
    const uniqueMembersAttendance = uniqueMembersSet.size;

    res.json({
      today: {
        attendance: todayAttendanceCount,
        birthdays: birthdaysTodayCount,
        expiresToday: expiresTodayCount,
        ptExpiresToday: ptExpiresTodayCount,
      },
      attendanceMonthly: {
        monthlyCheckIns,
        uniqueMembersAttendance,
      },
      membershipExpiry: {
        expiring1to3,
        expiring4to7,
        expiring8to15,
      },
      ptPlanExpiry: {
        ptExpiring1to3,
        ptExpiring4to7,
        ptExpiring8to15,
      },
      membershipOverview: {
        activeMembers,
        expiredMembers,
        totalMembers,
        blockMembers,
      },
      ptPlanOverview: {
        activePTPlans,
        expiredPTPlans,
        totalPTPlans,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const getFinancialStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [allMembers, allExpenses, allServices] = await Promise.all([
      Member.find().populate("planId"),
      Expense.find(),
      GymService.find(),
    ]);
    const now = new Date();

    const isSameDay = (d1: Date, d2: Date) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    let membershipCollectedToday = 0;
    allMembers.forEach((m) => {
      const pDate = m.paymentDate ? new Date(m.paymentDate) : new Date(m.createdAt);
      if (isSameDay(pDate, now)) {
        membershipCollectedToday += m.paidAmount || 0;
      }
    });

    const computeRange = (startDate?: Date, endDate?: Date) => {
      let admissionFees = 0;
      let membershipCollected = 0;
      let membershipDue = 0;
      let ptDue = 0;
      let servicePaid = 0;
      let serviceDue = 0;
      let expense = 0;

      allMembers.forEach((m) => {
        const date = m.paymentDate ? new Date(m.paymentDate) : new Date(m.createdAt);
        if (startDate && date < startDate) return;
        if (endDate && date > endDate) return;

        admissionFees += m.admissionFees || 0;
        membershipCollected += m.paidAmount || 0;
        membershipDue += m.dueAmount || 0;

        const planName = (m.planId as any)?.name?.toLowerCase() || "";
        if (planName.includes("pt") || planName.includes("personal")) {
          ptDue += m.dueAmount || 0;
        }
      });

      allExpenses.forEach((e) => {
        const date = new Date(e.date);
        if (startDate && date < startDate) return;
        if (endDate && date > endDate) return;
        expense += e.amount || 0;
      });

      allServices.forEach((s) => {
        const date = new Date(s.date);
        if (startDate && date < startDate) return;
        if (endDate && date > endDate) return;
        servicePaid += s.paidAmount || 0;
        serviceDue += s.dueAmount || 0;
      });

      return {
        admissionFees,
        membershipCollected,
        membershipDue,
        ptDue,
        servicePaid,
        serviceDue,
        expense,
      };
    };

    // Calculate month filters
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const startThisMonth = new Date(currentYear, currentMonth, 1);
    const endThisMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    const startLastMonth = new Date(currentYear, currentMonth - 1, 1);
    const endLastMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    const startLast3Months = new Date(currentYear, currentMonth - 2, 1);

    const thisMonthStats = computeRange(startThisMonth, endThisMonth);
    const lastMonthStats = computeRange(startLastMonth, endLastMonth);
    const last3MonthsStats = computeRange(startLast3Months, endThisMonth);

    // Calculate year filters
    const startThisYear = new Date(currentYear, 0, 1);
    const endThisYear = new Date(currentYear, 11, 31, 23, 59, 59);

    const startLastYear = new Date(currentYear - 1, 0, 1);
    const endLastYear = new Date(currentYear - 1, 11, 31, 23, 59, 59);

    const thisYearStats = computeRange(startThisYear, endThisYear);
    const lastYearStats = computeRange(startLastYear, endLastYear);
    const lifetimeStats = computeRange();

    let customStats = null;
    if (req.query.from || req.query.to) {
      const fDate = req.query.from ? new Date(String(req.query.from)) : undefined;
      let tDate = req.query.to ? new Date(String(req.query.to)) : undefined;
      if (tDate) tDate.setHours(23, 59, 59, 999);
      customStats = computeRange(fDate, tDate);
    }

    res.json({
      todayCollection: membershipCollectedToday,
      thisMonth: thisMonthStats,
      lastMonth: lastMonthStats,
      last3Months: last3MonthsStats,
      thisYear: thisYearStats,
      lastYear: lastYearStats,
      lifetime: lifetimeStats,
      custom: customStats,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const addBackDatedAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { memberId, dateStr, punchInTime } = req.body;
    if (!memberId || !dateStr) {
      res.status(400).json({ message: "memberId and dateStr are required" });
      return;
    }

    const member = await Member.findById(memberId);
    if (!member) {
      res.status(404).json({ message: "Member not found" });
      return;
    }

    let inTime = new Date();
    if (punchInTime) {
      inTime = new Date(punchInTime);
    }

    const record = await Attendance.create({
      memberId,
      dateStr,
      punchInTime: inTime,
      status: "punched_in",
      createdBy: req.userId || null,
    });

    res.status(201).json({ message: "Back-dated attendance recorded successfully", record });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const getMonthlyAttendanceCounts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const month = Number(req.query.month) || new Date().getMonth() + 1;

    const monthStr = String(month).padStart(2, "0");
    const datePrefix = `${year}-${monthStr}`;

    const records = await Attendance.find({ dateStr: { $regex: `^${datePrefix}` } });

    const counts: Record<string, number> = {};
    records.forEach((r) => {
      counts[r.dateStr] = (counts[r.dateStr] || 0) + 1;
    });

    res.json({ counts });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const getMemberAttendanceHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { memberId } = req.params;
    const records = await Attendance.find({ memberId }).sort({ createdAt: -1 });
    res.json({ records });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const getMyAttendanceHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    const member = await Member.findOne({
      $or: [
        { accountUserId: user._id },
        { email: user.email.toLowerCase() },
      ],
    });
    if (!member) {
      res.json({ records: [], member: null });
      return;
    }

    const query: any = { memberId: member._id };
    if (req.query.year && req.query.month) {
      const year = String(req.query.year);
      const monthStr = String(req.query.month).padStart(2, "0");
      query.dateStr = { $regex: `^${year}-${monthStr}` };
    }

    const records = await Attendance.find(query).sort({ punchInTime: -1, createdAt: -1 });
    res.json({ records, member });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};


