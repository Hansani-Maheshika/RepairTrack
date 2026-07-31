import type { UserRole } from "../utils/jwt.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        staffCode: string;
        fullName: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

export {};
