import { randomBytes } from "crypto";
import type {
  Request,
  Response,
  NextFunction,
} from "express";
import { findUserById } from "./store.ts";
import {
  getPermissionsForRole,
  roleHasPermission,
} from "./permissions.ts";
import type {
  AppUserRecord,
  AuthUser,
  UserRole,
} from "./types.ts";

export function toAuthUser(
  user: AppUserRecord,
): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    mustChangePassword:
      user.must_change_password,
    permissions:
      getPermissionsForRole(user.role),
    lastLoginAt:
      user.last_login_at,
    createdAt:
      user.created_at,
  };
}

export function ensureCsrfToken(
  req: Request,
): string {
  if (!req.session.csrfToken) {
    req.session.csrfToken =
      randomBytes(32).toString("hex");
  }

  return req.session.csrfToken;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const sessionAuth =
      req.session.auth;

    if (!sessionAuth?.userId) {
      return res.status(401).json({
        error:
          "Authentication required.",
      });
    }

    const user = await findUserById(
      sessionAuth.userId,
    );

    if (
      !user ||
      user.status !== "active"
    ) {
      req.session.destroy(
        () => undefined,
      );

      return res.status(401).json({
        error:
          "Your session is no longer valid.",
      });
    }

    if (
      user.session_version !==
      sessionAuth.sessionVersion
    ) {
      req.session.destroy(
        () => undefined,
      );

      return res.status(401).json({
        error:
          "Your session has expired. Please sign in again.",
      });
    }

    req.authUser =
      toAuthUser(user);

    ensureCsrfToken(req);

    next();
  } catch (error) {
    next(error);
  }
}

export function requirePermission(
  permission: string,
) {
  return (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    if (
      req.authUser
        ?.mustChangePassword
    ) {
      return res.status(403).json({
        error:
          "You must change your temporary password before continuing.",
        code:
          "PASSWORD_CHANGE_REQUIRED",
      });
    }

    const role =
      req.authUser?.role as
        | UserRole
        | undefined;

    if (
      !role ||
      !roleHasPermission(
        role,
        permission,
      )
    ) {
      return res.status(403).json({
        error:
          "You do not have permission to perform this action.",
      });
    }

    next();
  };
}

export function requireCsrf(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (
    ["GET", "HEAD", "OPTIONS"].includes(
      req.method,
    )
  ) {
    return next();
  }

  const expected =
    req.session.csrfToken;

  const supplied =
    req.get("x-csrf-token");

  if (
    !expected ||
    !supplied ||
    expected !== supplied
  ) {
    return res.status(403).json({
      error:
        "Security token is missing or invalid. Refresh and try again.",
    });
  }

  next();
}