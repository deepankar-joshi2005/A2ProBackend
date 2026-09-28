import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IPermissions } from "../models/user.model.js";

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
  userPermissions?: IPermissions;
  userIsTrainer?: boolean;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "No token provided" });
    return;
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({ message: "Invalid token" });
      return;
    }
    req.userId = String(user._id);
    req.userRole = user.role;
    req.userPermissions = user.permissions;
    req.userIsTrainer = user.isTrainer;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.userRole !== "admin") {
    res.status(403).json({ message: "Admin access required" });
    return;
  }
  next();
};

// Admin always passes. A staff member passes only if the boolean at the given
// dot-path (e.g. "members.view") is true on their stored permissions.
export const requirePermission = (dotKey: string) => (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.userRole === "admin") {
    next();
    return;
  }
  if (req.userRole === "staff") {
    const value = dotKey.split(".").reduce<any>((obj, key) => (obj == null ? undefined : obj[key]), req.userPermissions);
    if (value === true) {
      next();
      return;
    }
  }
  res.status(403).json({ message: "You don't have permission to do this" });
};
