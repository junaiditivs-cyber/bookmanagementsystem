import type {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  findUserById,
} from "./store.ts";

import {
  getPermissionsForRole,
  roleHasPermission,
} from "./permissions.ts";

import {
  verifyAuthToken,
} from "./token.ts";

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

function getBearerToken(
  req: Request,
): string | null {
  const authorization = String(
    req.get("authorization") || "",
  ).trim();

  const match = authorization.match(
    /^Bearer\s+(.+)$/i,
  );

  return match?.[1]?.trim() || null;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return res.status(401).json({
        error: "Authentication required.",
      });
    }

    const payload =
      verifyAuthToken(token);

    if (!payload) {
      return res.status(401).json({
        error:
          "Your sign-in token is invalid or expired. Please sign in again.",
      });
    }

    const user = await findUserById(
      payload.userId,
    );

    if (
      !user ||
      user.status !== "active"
    ) {
      return res.status(401).json({
        error:
          "Your account is no longer active.",
      });
    }

    if (
      user.session_version !==
      payload.sessionVersion
    ) {
      return res.status(401).json({
        error:
          "Your sign-in token has expired. Please sign in again.",
      });
    }

    req.authUser = toAuthUser(user);
    req.authToken = payload;

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


