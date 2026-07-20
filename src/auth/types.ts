export type UserRole =
  | "super_admin"
  | "admin"
  | "manager"
  | "staff"
  | "viewer";

export type UserStatus =
  | "active"
  | "inactive";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  mustChangePassword: boolean;
  permissions: string[];
  lastLoginAt: string | null;
  createdAt: string;
}

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  mustChangePassword: boolean;
  isLocked: boolean;
  lockedUntil: string | null;
  lastLoginAt: string | null;
  passwordChangedAt: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface AuthAuditLog {
  id: string;
  timestamp: string;
  actor_user_id: string | null;
  actor_email: string;
  action: string;
  target_user_id: string | null;
  target_email: string | null;
  ip_address: string | null;
  user_agent: string | null;
  result: "success" | "failure";
  details: string;
}