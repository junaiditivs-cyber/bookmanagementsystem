import type { AuthUser } from "./types.ts";

declare module "express-session" {
  interface SessionData {
    auth?: {
      userId: string;
      email: string;
      role: string;
      sessionVersion: number;
    };

    csrfToken?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
    }
  }
}

export {};