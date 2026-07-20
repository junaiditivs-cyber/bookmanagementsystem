export const USER_ROLES = [
  "super_admin",
  "admin",
  "manager",
  "staff",
  "viewer",
] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type UserStatus = "active" | "inactive";

export interface AppUserRecord {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  password_history: string[];
  role: UserRole;
  status: UserStatus;
  must_change_password: boolean;
  failed_login_attempts: number;
  locked_until: string | null;
  session_version: number;
  last_login_at: string | null;
  password_changed_at: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

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

export interface LocalAuthData {
  users: AppUserRecord[];
  audit_logs: AuthAuditLog[];
}