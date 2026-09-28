import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import Member, { IMember } from "../models/member.model.js";

const WEEKDAY_3 = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_3 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isSameDate(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function isPTPlanName(name: string | undefined): boolean {
  const n = (name || "").toLowerCase();
  return n.includes("pt") || n.includes("personal");
}

function planStartDate(m: IMember): Date {
  const plan = m.planId as any;
  if (plan && typeof plan.durationInDays === "number" && m.planExpiryDate) {
    return addDays(new Date(m.planExpiryDate), -plan.durationInDays);
  }
  return new Date(m.joiningDate);
}

function parseRangeQuery(from: unknown, to: unknown): { fromDate: Date | null; toDate: Date | null } {
  const fromDate = from ? new Date(String(from)) : null;
  const toDate = to ? new Date(String(to)) : null;
  if (toDate) toDate.setHours(23, 59, 59, 999);
  return { fromDate, toDate };
}

export const getTrends = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const period = String(req.query.period || "week");
    const now = new Date();
    const allMembers = await Member.find({}, "paymentDate paidAmount joiningDate");

    const points: { label: string; date: Date }[] = [];
    if (period === "week") {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        points.push({ label: WEEKDAY_3[d.getDay()], date: d });
      }
    } else {
      const monthsBack = period === "quarter" ? 3 : period === "six_month" ? 6 : 12;
      // Quarter has room for the year; six-month/yearly stay short to avoid label overlap.
      const includeYear = period === "quarter";
      for (let i = monthsBack - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = includeYear ? `${MONTH_3[d.getMonth()]} ${d.getFullYear()}` : MONTH_3[d.getMonth()];
        points.push({ label, date: d });
      }
    }

    const collectedPayment = points.map((p) => {
      let value = 0;
      allMembers.forEach((m) => {
        if (!m.paymentDate) return;
        const pd = new Date(m.paymentDate);
        const match = period === "week" ? isSameDate(pd, p.date) : isSameMonth(pd, p.date);
        if (match) value += m.paidAmount || 0;
      });
      return { label: p.label, value };
    });

    const newMembers = points.map((p) => {
      let value = 0;
      allMembers.forEach((m) => {
        const jd = new Date(m.joiningDate);
        const match = period === "week" ? isSameDate(jd, p.date) : isSameMonth(jd, p.date);
        if (match) value += 1;
      });
      return { label: p.label, value };
    });

    res.json({ collectedPayment, newMembers });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const getCollectionSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fromDate, toDate } = parseRangeQuery(req.query.from, req.query.to);
    const allMembers = await Member.find().populate("planId", "name amount durationInDays");

    const filtered = allMembers.filter((m) => {
      const start = planStartDate(m);
      if (fromDate && start < fromDate) return false;
      if (toDate && start > toDate) return false;
      return true;
    });

    const summarize = (list: IMember[]) => {
      let received = 0;
      let balanceDue = 0;
      list.forEach((m) => {
        received += m.paidAmount || 0;
        balanceDue += m.dueAmount || 0;
      });
      return { count: list.length, completeAmount: received + balanceDue, received, balanceDue };
    };

    const fullyPaid = filtered.filter((m) => (m.paidAmount || 0) > 0 && (m.dueAmount || 0) === 0);
    const partiallyPaid = filtered.filter((m) => (m.paidAmount || 0) > 0 && (m.dueAmount || 0) > 0);
    const notPaid = filtered.filter((m) => (m.paidAmount || 0) === 0);

    res.json({
      allMemberships: summarize(filtered),
      fullyPaid: summarize(fullyPaid),
      partiallyPaid: summarize(partiallyPaid),
      notPaid: summarize(notPaid),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const getPlanDue = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fromDate, toDate } = parseRangeQuery(req.query.from, req.query.to);
    const ptOnly = String(req.query.pt) === "true";

    const allMembers = await Member.find({ dueAmount: { $gt: 0 } }).populate(
      "planId",
      "name amount durationInDays"
    );

    const filtered = allMembers.filter((m) => {
      const isPT = isPTPlanName((m.planId as any)?.name);
      if (ptOnly && !isPT) return false;
      if (!ptOnly && isPT) return false;

      const start = planStartDate(m);
      if (fromDate && start < fromDate) return false;
      if (toDate && start > toDate) return false;
      return true;
    });

    const dueAmount = filtered.reduce((s, m) => s + (m.dueAmount || 0), 0);

    const members = filtered
      .sort((a, b) => (b.dueAmount || 0) - (a.dueAmount || 0))
      .map((m) => {
        const pStartDate = planStartDate(m);
        const purchaseDate = m.joiningDate || pStartDate;
        const totalAmount = m.planAmount || ((m.paidAmount || 0) + (m.dueAmount || 0));
        return {
          _id: m._id,
          name: m.name,
          membershipId: m.membershipId,
          mobile: m.mobile,
          countryCode: m.countryCode,
          photoUrl: m.photoUrl,
          planName: (m.planId as any)?.name || "",
          dueAmount: m.dueAmount || 0,
          completeAmount: totalAmount,
          paidAmount: m.paidAmount || 0,
          purchaseDate,
          planStartDate: pStartDate,
          planExpiryDate: m.planExpiryDate,
        };
      });

    res.json({ dueAmount, members });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const getAdmissionReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fromDate, toDate } = parseRangeQuery(req.query.from, req.query.to);

    const allMembers = await Member.find().populate("planId", "name amount durationInDays");

    const filtered = allMembers.filter((m) => {
      const start = planStartDate(m);
      if (fromDate && start < fromDate) return false;
      if (toDate && start > toDate) return false;
      return true;
    });

    const totalAdmissionFees = filtered.reduce((sum, m) => sum + (m.admissionFees || 0), 0);

    const members = filtered
      .filter((m) => (m.admissionFees || 0) > 0)
      .map((m) => ({
        _id: m._id,
        name: m.name,
        membershipId: m.membershipId,
        mobile: m.mobile,
        countryCode: m.countryCode,
        photoUrl: m.photoUrl,
        planName: (m.planId as any)?.name || "",
        admissionFees: m.admissionFees || 0,
        joiningDate: m.joiningDate,
        planStartDate: planStartDate(m),
        paymentMethod: m.paymentMethod,
      }));

    res.json({ totalAdmissionFees, members, count: members.length });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const getSales = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fromDate, toDate } = parseRangeQuery(req.query.from, req.query.to);
    const paymentMethod = req.query.paymentMethod ? String(req.query.paymentMethod) : "all";
    const planType = req.query.planType ? String(req.query.planType) : "all";

    const allMembers = await Member.find().populate("planId", "name amount durationInDays");

    const now = new Date();
    let thisMonthCollection = 0;
    allMembers.forEach((m) => {
      if (!m.paymentDate) return;
      const pd = new Date(m.paymentDate);
      if (isSameMonth(pd, now)) thisMonthCollection += m.paidAmount || 0;
    });

    let filtered = allMembers.filter((m) => !!m.paymentDate);
    if (fromDate) filtered = filtered.filter((m) => new Date(m.paymentDate as Date) >= fromDate);
    if (toDate) filtered = filtered.filter((m) => new Date(m.paymentDate as Date) <= toDate);
    if (paymentMethod !== "all") {
      filtered = filtered.filter((m) => m.paymentMethod === paymentMethod);
    }
    if (planType !== "all") {
      filtered = filtered.filter((m) => {
        const isPT = isPTPlanName((m.planId as any)?.name);
        return planType === "pt" ? isPT : !isPT;
      });
    }

    filtered.sort((a, b) => new Date(b.paymentDate as Date).getTime() - new Date(a.paymentDate as Date).getTime());

    const sales = filtered.map((m) => {
      const pd = new Date(m.paymentDate as Date);
      return {
        _id: m._id,
        name: m.name,
        membershipId: m.membershipId,
        mobile: m.mobile,
        countryCode: m.countryCode,
        invoiceNo: `${m.membershipId}-FIT-${pd.getFullYear()}`,
        date: m.paymentDate,
        paidAmount: m.paidAmount || 0,
        dueAmount: m.dueAmount || 0,
        planName: (m.planId as any)?.name || "",
        paymentMethod: m.paymentMethod,
      };
    });

    res.json({ thisMonthCollection, sales });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

