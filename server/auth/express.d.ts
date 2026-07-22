import type {
  AuthTokenPayload,
} from "./token.ts";

import type {
  AuthUser,
} from "./types.ts";

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
      authToken?: AuthTokenPayload;
    }
  }
}

export {};


