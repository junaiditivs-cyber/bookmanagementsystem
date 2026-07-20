import type { UserRole } from "./types.ts";

export const PERMISSIONS = {
  DATA_READ: "data.read",
  INVENTORY_MANAGE: "inventory.manage",
  INVENTORY_DELETE: "inventory.delete",
  STOCK_MANAGE: "stock.manage",
  SALES_MANAGE: "sales.manage",
  RETURNS_MANAGE: "returns.manage",
  TRANSFERS_MANAGE: "transfers.manage",
  DAMAGE_MANAGE: "damage.manage",
  SETTINGS_MANAGE: "settings.manage",
  USERS_MANAGE: "users.manage",
  AUTH_AUDIT_READ: "auth.audit.read",
} as const;

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  super_admin: ALL_PERMISSIONS,

  admin: [
    PERMISSIONS.DATA_READ,
    PERMISSIONS.INVENTORY_MANAGE,
    PERMISSIONS.INVENTORY_DELETE,
    PERMISSIONS.STOCK_MANAGE,
    PERMISSIONS.SALES_MANAGE,
    PERMISSIONS.RETURNS_MANAGE,
    PERMISSIONS.TRANSFERS_MANAGE,
    PERMISSIONS.DAMAGE_MANAGE,
    PERMISSIONS.SETTINGS_MANAGE,
    PERMISSIONS.AUTH_AUDIT_READ,
  ],

  manager: [
    PERMISSIONS.DATA_READ,
    PERMISSIONS.INVENTORY_MANAGE,
    PERMISSIONS.STOCK_MANAGE,
    PERMISSIONS.SALES_MANAGE,
    PERMISSIONS.RETURNS_MANAGE,
    PERMISSIONS.TRANSFERS_MANAGE,
    PERMISSIONS.DAMAGE_MANAGE,
  ],

  staff: [
    PERMISSIONS.DATA_READ,
    PERMISSIONS.INVENTORY_MANAGE,
    PERMISSIONS.STOCK_MANAGE,
    PERMISSIONS.SALES_MANAGE,
    PERMISSIONS.RETURNS_MANAGE,
  ],

  viewer: [
    PERMISSIONS.DATA_READ,
  ],
};

export function getPermissionsForRole(
  role: UserRole,
): string[] {
  return [...ROLE_PERMISSIONS[role]];
}

export function roleHasPermission(
  role: UserRole,
  permission: string,
): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}