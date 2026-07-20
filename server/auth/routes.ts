import { Router, type Request } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import {
  addAuthAuditLog,
  countActiveSuperAdmins,
  countUsers,
  createUserRecord,
  findUserByEmail,
  findUserById,
  listAuthAuditLogs,
  listUsers,
  updateUserRecord,
} from "./store.ts";
import {
  generateTemporaryPassword,
  hashPassword,
  validatePassword,
  verifyPassword,
} from "./password.ts";
import {
  ensureCsrfToken,
  requireAuth,
  requireCsrf,
  requirePermission,
  toAuthUser,
} from "./middleware.ts";
import { PERMISSIONS } from "./permissions.ts";
import { REMEMBER_ME_DURATION_MS, SESSION_DURATION_MS } from "./session.ts";
import { USER_ROLES, type AppUserRecord, type UserRole } from "./types.ts";

const authRouter = Router();
const usersRouter = Router();
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const ACCOUNT_LOCK_MS = 15 * 60 * 1000;

const ALLOWED_EMAIL_DOMAIN = "mjkhan.com";
const ALLOWED_EMAIL_SUFFIX = `@${ALLOWED_EMAIL_DOMAIN}`;
const ALLOWED_EMAIL_ERROR = `Only ${ALLOWED_EMAIL_SUFFIX} email addresses are allowed.`;

function isAllowedEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(ALLOWED_EMAIL_SUFFIX);
}

const allowedEmailSchema = z
  .string()
  .trim()
  .email()
  .max(254)
  .refine(isAllowedEmail, {
    message: ALLOWED_EMAIL_ERROR,
  });

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many sign-in attempts. Please try again later." },
});

const loginSchema = z.object({
  email: allowedEmailSchema,
  password: z.string().min(1).max(128),
  rememberMe: z.boolean().optional().default(false),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: z.string().min(1).max(128),
    confirmPassword: z.string().min(1).max(128),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "New password and confirmation do not match.",
    path: ["confirmPassword"],
  });

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: allowedEmailSchema,
  role: z.enum(USER_ROLES),
  password: z.string().max(128).optional(),
  generatePassword: z.boolean().optional().default(true),
  mustChangePassword: z.boolean().optional().default(true),
});

const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: allowedEmailSchema,
  role: z.enum(USER_ROLES),
  status: z.enum(["active", "inactive"]),
  mustChangePassword: z.boolean().optional(),
});

const resetPasswordSchema = z.object({
  password: z.string().max(128).optional(),
  generatePassword: z.boolean().optional().default(true),
  mustChangePassword: z.boolean().optional().default(true),
});

function getClientIp(req: Request): string | null {
  return req.ip || req.socket.remoteAddress || null;
}

async function audit(
  req: Request,
  input: {
    action: string;
    result: "success" | "failure";
    details: string;
    targetUserId?: string | null;
    targetEmail?: string | null;
    actorUserId?: string | null;
    actorEmail?: string;
  },
) {
  await addAuthAuditLog({
    actor_user_id: input.actorUserId ?? req.authUser?.id ?? null,
    actor_email: input.actorEmail ?? req.authUser?.email ?? "anonymous",
    action: input.action,
    target_user_id: input.targetUserId ?? null,
    target_email: input.targetEmail ?? null,
    ip_address: getClientIp(req),
    user_agent: req.get("user-agent") || null,
    result: input.result,
    details: input.details,
  });
}

function publicUser(user: AppUserRecord) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    mustChangePassword: user.must_change_password,
    isLocked: Boolean(user.locked_until && new Date(user.locked_until).getTime() > Date.now()),
    lockedUntil: user.locked_until,
    lastLoginAt: user.last_login_at,
    passwordChangedAt: user.password_changed_at,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    createdBy: user.created_by,
    updatedBy: user.updated_by,
  };
}

function regenerateSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => (error ? reject(error) : resolve()));
  });
}

function saveSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.save((error) => (error ? reject(error) : resolve()));
  });
}

function destroySession(req: Request): Promise<void> {
  return new Promise((resolve) => {
    req.session.destroy(() => resolve());
  });
}

async function passwordWasUsedBefore(user: AppUserRecord, password: string): Promise<boolean> {
  const hashes = [user.password_hash, ...user.password_history].filter(Boolean);
  for (const hash of hashes) {
    if (await verifyPassword(password, hash)) return true;
  }
  return false;
}

authRouter.get("/bootstrap-status", async (_req, res, next) => {
  try {
    const totalUsers = await countUsers();
    res.json({ initialized: totalUsers > 0 });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", loginLimiter, async (req, res, next) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error:
        parsed.error.issues[0]?.message ||
        "Enter a valid email and password.",
    });
  }

  const { email, password, rememberMe } = parsed.data;
  try {
    const user = await findUserByEmail(email);
    const genericError = "Invalid email or password.";

    if (!user) {
      await audit(req, {
        action: "login",
        result: "failure",
        details: "Sign-in failed: account not found or password invalid.",
        targetEmail: email.toLowerCase(),
        actorEmail: email.toLowerCase(),
      });
      return res.status(401).json({ error: genericError });
    }

    if (user.status !== "active") {
      await audit(req, {
        action: "login",
        result: "failure",
        details: "Sign-in rejected because the account is inactive.",
        targetUserId: user.id,
        targetEmail: user.email,
        actorUserId: user.id,
        actorEmail: user.email,
      });
      return res.status(401).json({ error: genericError });
    }

    if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
      await audit(req, {
        action: "login",
        result: "failure",
        details: "Sign-in rejected because the account is temporarily locked.",
        targetUserId: user.id,
        targetEmail: user.email,
        actorUserId: user.id,
        actorEmail: user.email,
      });
      return res.status(423).json({
        error: "Account temporarily locked after repeated failed attempts. Try again later.",
      });
    }

    const validPassword = await verifyPassword(password, user.password_hash);
    if (!validPassword) {
      const failedAttempts = user.failed_login_attempts + 1;
      const shouldLock = failedAttempts >= MAX_FAILED_LOGIN_ATTEMPTS;
      await updateUserRecord(user.id, {
        failed_login_attempts: shouldLock ? 0 : failedAttempts,
        locked_until: shouldLock
          ? new Date(Date.now() + ACCOUNT_LOCK_MS).toISOString()
          : null,
        updated_by: user.email,
      });
      await audit(req, {
        action: "login",
        result: "failure",
        details: shouldLock
          ? "Sign-in failed and account was temporarily locked."
          : `Sign-in failed. Attempt ${failedAttempts} of ${MAX_FAILED_LOGIN_ATTEMPTS}.`,
        targetUserId: user.id,
        targetEmail: user.email,
        actorUserId: user.id,
        actorEmail: user.email,
      });
      return res.status(401).json({ error: genericError });
    }

    const now = new Date().toISOString();
    const signedInUser = await updateUserRecord(user.id, {
      failed_login_attempts: 0,
      locked_until: null,
      last_login_at: now,
      updated_by: user.email,
    });

    await regenerateSession(req);
    req.session.auth = {
      userId: signedInUser.id,
      email: signedInUser.email,
      role: signedInUser.role,
      sessionVersion: signedInUser.session_version,
    };
    req.session.cookie.maxAge = rememberMe
      ? REMEMBER_ME_DURATION_MS
      : SESSION_DURATION_MS;
    const csrfToken = ensureCsrfToken(req);
    await saveSession(req);

    await audit(req, {
      action: "login",
      result: "success",
      details: rememberMe ? "User signed in with remembered session." : "User signed in.",
      targetUserId: signedInUser.id,
      targetEmail: signedInUser.email,
      actorUserId: signedInUser.id,
      actorEmail: signedInUser.email,
    });

    res.json({ user: toAuthUser(signedInUser), csrfToken });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", requireAuth, async (req, res) => {
  res.json({ user: req.authUser, csrfToken: ensureCsrfToken(req) });
});

authRouter.post("/logout", requireAuth, requireCsrf, async (req, res, next) => {
  try {
    const currentUser = req.authUser;
    await audit(req, {
      action: "logout",
      result: "success",
      details: "User signed out.",
      targetUserId: currentUser?.id,
      targetEmail: currentUser?.email,
    });
    await destroySession(req);
    res.clearCookie("ivs.books.sid", { path: "/" });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

authRouter.post(
  "/change-password",
  requireAuth,
  requireCsrf,
  async (req, res, next) => {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message || "Invalid password information.",
      });
    }

    try {
      const user = await findUserById(req.authUser!.id);
      if (!user) return res.status(404).json({ error: "User not found." });

      if (!(await verifyPassword(parsed.data.currentPassword, user.password_hash))) {
        await audit(req, {
          action: "change_password",
          result: "failure",
          details: "Password change failed because the current password was invalid.",
          targetUserId: user.id,
          targetEmail: user.email,
        });
        return res.status(400).json({ error: "Current password is incorrect." });
      }

      const validation = validatePassword(parsed.data.newPassword, {
        name: user.name,
        email: user.email,
      });
      if (!validation.valid) {
        return res.status(400).json({ error: validation.errors[0], errors: validation.errors });
      }

      if (await passwordWasUsedBefore(user, parsed.data.newPassword)) {
        return res.status(400).json({
          error: "Choose a password that has not been used recently.",
        });
      }

      const newHash = await hashPassword(parsed.data.newPassword);
      const updated = await updateUserRecord(user.id, {
        password_hash: newHash,
        password_history: [user.password_hash, ...user.password_history].slice(0, 5),
        must_change_password: false,
        password_changed_at: new Date().toISOString(),
        session_version: user.session_version + 1,
        updated_by: user.email,
      });

      req.session.auth = {
        userId: updated.id,
        email: updated.email,
        role: updated.role,
        sessionVersion: updated.session_version,
      };
      req.session.csrfToken = undefined;
      const csrfToken = ensureCsrfToken(req);
      await saveSession(req);

      await audit(req, {
        action: "change_password",
        result: "success",
        details: "User changed their password.",
        targetUserId: updated.id,
        targetEmail: updated.email,
      });

      res.json({ user: toAuthUser(updated), csrfToken });
    } catch (error) {
      next(error);
    }
  },
);

usersRouter.use(requireAuth, requireCsrf, requirePermission(PERMISSIONS.USERS_MANAGE));

usersRouter.get("/", async (_req, res, next) => {
  try {
    res.json({ users: (await listUsers()).map(publicUser) });
  } catch (error) {
    next(error);
  }
});

usersRouter.get("/audit-logs", async (req, res, next) => {
  try {
    const limit = Number(req.query.limit || 200);
    res.json({ logs: await listAuthAuditLogs(limit) });
  } catch (error) {
    next(error);
  }
});

usersRouter.post("/", async (req, res, next) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid user details." });
  }

  try {
    const actor = req.authUser!;
    const generatedPassword = parsed.data.generatePassword
      ? generateTemporaryPassword()
      : String(parsed.data.password || "");
    const validation = validatePassword(generatedPassword, {
      name: parsed.data.name,
      email: parsed.data.email,
    });
    if (!validation.valid) {
      return res.status(400).json({ error: validation.errors[0], errors: validation.errors });
    }

    if (await findUserByEmail(parsed.data.email)) {
      return res.status(409).json({ error: "A user with this email already exists." });
    }

    const now = new Date().toISOString();
    const user = await createUserRecord({
      name: parsed.data.name,
      email: parsed.data.email,
      password_hash: await hashPassword(generatedPassword),
      password_history: [],
      role: parsed.data.role,
      status: "active",
      must_change_password: parsed.data.mustChangePassword,
      failed_login_attempts: 0,
      locked_until: null,
      session_version: 1,
      last_login_at: null,
      password_changed_at: now,
      created_by: actor.email,
      updated_by: actor.email,
    });

    await audit(req, {
      action: "create_user",
      result: "success",
      details: `Created ${user.role} account.`,
      targetUserId: user.id,
      targetEmail: user.email,
    });

    res.status(201).json({
      user: publicUser(user),
      temporaryPassword: generatedPassword,
    });
  } catch (error: any) {
    next(error);
  }
});

usersRouter.put("/:id", async (req, res, next) => {
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid user details." });
  }

  try {
    const actor = req.authUser!;
    const target = await findUserById(req.params.id);
    if (!target) return res.status(404).json({ error: "User not found." });

    const isRemovingActiveSuperAdmin =
      target.role === "super_admin" &&
      target.status === "active" &&
      (parsed.data.role !== "super_admin" || parsed.data.status !== "active");

    if (isRemovingActiveSuperAdmin && (await countActiveSuperAdmins(target.id)) === 0) {
      return res.status(400).json({ error: "At least one active super admin must remain." });
    }

    if (target.id === actor.id && parsed.data.status !== "active") {
      return res.status(400).json({ error: "You cannot deactivate your own account." });
    }
    if (target.id === actor.id && parsed.data.role !== target.role) {
      return res.status(400).json({ error: "You cannot change your own role." });
    }

    const sensitiveChange =
      target.role !== parsed.data.role ||
      target.status !== parsed.data.status ||
      target.email.toLowerCase() !== parsed.data.email.toLowerCase() ||
      (parsed.data.mustChangePassword !== undefined &&
        parsed.data.mustChangePassword !== target.must_change_password);
    const updated = await updateUserRecord(target.id, {
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role as UserRole,
      status: parsed.data.status,
      must_change_password:
        parsed.data.mustChangePassword ?? target.must_change_password,
      session_version: sensitiveChange ? target.session_version + 1 : target.session_version,
      updated_by: actor.email,
    });

    await audit(req, {
      action: "update_user",
      result: "success",
      details: `Updated account. Role: ${updated.role}; status: ${updated.status}.`,
      targetUserId: updated.id,
      targetEmail: updated.email,
    });

    res.json({ user: publicUser(updated) });
  } catch (error) {
    next(error);
  }
});

usersRouter.patch("/:id/status", async (req, res, next) => {
  const status = req.body?.status;
  if (!(["active", "inactive"] as const).includes(status)) {
    return res.status(400).json({ error: "Status must be active or inactive." });
  }

  try {
    const actor = req.authUser!;
    const target = await findUserById(req.params.id);
    if (!target) return res.status(404).json({ error: "User not found." });
    if (target.id === actor.id && status === "inactive") {
      return res.status(400).json({ error: "You cannot deactivate your own account." });
    }
    if (
      target.role === "super_admin" &&
      target.status === "active" &&
      status === "inactive" &&
      (await countActiveSuperAdmins(target.id)) === 0
    ) {
      return res.status(400).json({ error: "At least one active super admin must remain." });
    }

    const updated = await updateUserRecord(target.id, {
      status,
      session_version: target.session_version + 1,
      updated_by: actor.email,
    });
    await audit(req, {
      action: status === "active" ? "activate_user" : "deactivate_user",
      result: "success",
      details: `Account status changed to ${status}.`,
      targetUserId: updated.id,
      targetEmail: updated.email,
    });
    res.json({ user: publicUser(updated) });
  } catch (error) {
    next(error);
  }
});

usersRouter.post("/:id/reset-password", async (req, res, next) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid password reset request." });
  }

  try {
    const actor = req.authUser!;
    const target = await findUserById(req.params.id);
    if (!target) return res.status(404).json({ error: "User not found." });
    if (target.id === actor.id) {
      return res.status(400).json({ error: "Use Change Password for your own account." });
    }

    const temporaryPassword = parsed.data.generatePassword
      ? generateTemporaryPassword()
      : String(parsed.data.password || "");
    const validation = validatePassword(temporaryPassword, {
      name: target.name,
      email: target.email,
    });
    if (!validation.valid) {
      return res.status(400).json({ error: validation.errors[0], errors: validation.errors });
    }
    if (await passwordWasUsedBefore(target, temporaryPassword)) {
      return res.status(400).json({ error: "Choose a password not used recently by this user." });
    }

    const updated = await updateUserRecord(target.id, {
      password_hash: await hashPassword(temporaryPassword),
      password_history: [target.password_hash, ...target.password_history].slice(0, 5),
      must_change_password: parsed.data.mustChangePassword,
      password_changed_at: new Date().toISOString(),
      failed_login_attempts: 0,
      locked_until: null,
      session_version: target.session_version + 1,
      updated_by: actor.email,
    });

    await audit(req, {
      action: "reset_password",
      result: "success",
      details: "Administrator reset the user's password and invalidated existing sessions.",
      targetUserId: updated.id,
      targetEmail: updated.email,
    });

    res.json({ user: publicUser(updated), temporaryPassword });
  } catch (error) {
    next(error);
  }
});

usersRouter.post("/:id/unlock", async (req, res, next) => {
  try {
    const actor = req.authUser!;
    const target = await findUserById(req.params.id);
    if (!target) return res.status(404).json({ error: "User not found." });
    const updated = await updateUserRecord(target.id, {
      failed_login_attempts: 0,
      locked_until: null,
      updated_by: actor.email,
    });
    await audit(req, {
      action: "unlock_user",
      result: "success",
      details: "Administrator unlocked the account.",
      targetUserId: updated.id,
      targetEmail: updated.email,
    });
    res.json({ user: publicUser(updated) });
  } catch (error) {
    next(error);
  }
});

export { authRouter, usersRouter };