import type {
  NextFunction,
  Request,
  Response,
} from "express";

import {
  PERMISSIONS,
  roleHasPermission,
} from "./permissions.ts";

function requiredPermissionForRequest(
  req: Request,
): string | null {
  const method =
    req.method.toUpperCase();

  const path =
    req.path;

  if (method === "GET") {
    return PERMISSIONS.DATA_READ;
  }

  if (path === "/settings") {
    return PERMISSIONS.SETTINGS_MANAGE;
  }

  if (path === "/add-stock") {
    return PERMISSIONS.STOCK_MANAGE;
  }

  if (path === "/sales") {
    return PERMISSIONS.SALES_MANAGE;
  }

  if (
    path === "/customer-returns" ||
    path === "/publisher-returns"
  ) {
    return PERMISSIONS.RETURNS_MANAGE;
  }

  if (path === "/stock-transfers") {
    return PERMISSIONS.TRANSFERS_MANAGE;
  }

  if (path === "/damage-loss") {
    return PERMISSIONS.DAMAGE_MANAGE;
  }

  if (path === "/smart-entry") {
    return PERMISSIONS.INVENTORY_MANAGE;
  }

  if (
    path.startsWith("/books") ||
    path.startsWith("/publishers") ||
    path.startsWith("/locations") ||
    path.startsWith("/categories") ||
    path.startsWith("/subjects") ||
    path.startsWith("/classes")
  ) {
    return method === "DELETE"
      ? PERMISSIONS.INVENTORY_DELETE
      : PERMISSIONS.INVENTORY_MANAGE;
  }

  return PERMISSIONS.DATA_READ;
}

export function authorizeBusinessApi(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (
    req.authUser?.mustChangePassword
  ) {
    res.status(403).json({
      error:
        "You must change your temporary password before continuing.",
      code:
        "PASSWORD_CHANGE_REQUIRED",
    });

    return;
  }

  const role =
    req.authUser?.role;

  const requiredPermission =
    requiredPermissionForRequest(req);

  if (
    !role ||
    (
      requiredPermission &&
      !roleHasPermission(
        role,
        requiredPermission,
      )
    )
  ) {
    res.status(403).json({
      error:
        "You do not have permission to perform this action.",
    });

    return;
  }

  next();
}