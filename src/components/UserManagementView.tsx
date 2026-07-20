import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  Ban,
  CheckCircle2,
  Clipboard,
  Edit3,
  Eye,
  EyeOff,
  KeyRound,
  LockOpen,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { apiFetch, readApiError } from "../api/http";
import { useAuth } from "../auth/AuthContext";
import type { AuthAuditLog, ManagedUser, UserRole, UserStatus } from "../auth/types";

const ROLE_OPTIONS: Array<{ value: UserRole; label: string; description: string }> = [
  { value: "super_admin", label: "Super Admin", description: "Full system and user administration access." },
  { value: "admin", label: "Admin", description: "Operational, deletion, settings, and audit access." },
  { value: "manager", label: "Manager", description: "Inventory, stock, sales, returns, and transfer access." },
  { value: "staff", label: "Staff", description: "Daily inventory, stock, sales, and return operations." },
  { value: "viewer", label: "Viewer", description: "Read-only dashboard and inventory access." },
];

const EMPTY_FORM = {
  name: "",
  email: "",
  role: "staff" as UserRole,
  status: "active" as UserStatus,
  password: "",
  generatePassword: true,
  mustChangePassword: true,
};

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function roleLabel(role: UserRole) {
  return ROLE_OPTIONS.find((option) => option.value === role)?.label || role;
}

export default function UserManagementView() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuthAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"users" | "audit">("users");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | UserStatus | "locked">("all");
  const [modalMode, setModalMode] = useState<"create" | "edit" | "reset" | null>(null);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [temporaryPasswordEmail, setTemporaryPasswordEmail] = useState("");
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    window.setTimeout(() => setNotification(null), 4500);
  };

  const loadUsers = async () => {
    const response = await apiFetch("/api/users");
    if (!response.ok) throw new Error(await readApiError(response));
    const body = await response.json();
    setUsers(body.users || []);
  };

  const loadAuditLogs = async () => {
    const response = await apiFetch("/api/users/audit-logs?limit=300");
    if (!response.ok) throw new Error(await readApiError(response));
    const body = await response.json();
    setAuditLogs(body.logs || []);
  };

  const refresh = async () => {
    setLoading(true);
    try {
      await Promise.all([loadUsers(), loadAuditLogs()]);
    } catch (error) {
      showNotification(error instanceof Error ? error.message : "Unable to load user management data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch = !query || user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query);
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "locked" ? user.isLocked : user.status === statusFilter);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const stats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((user) => user.status === "active").length,
      inactive: users.filter((user) => user.status === "inactive").length,
      locked: users.filter((user) => user.isLocked).length,
    }),
    [users],
  );

  const openCreate = () => {
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setShowPassword(false);
    setModalMode("create");
  };

  const openEdit = (user: ManagedUser) => {
    setEditingUser(user);
    setForm({
      ...EMPTY_FORM,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      mustChangePassword: user.mustChangePassword,
    });
    setModalMode("edit");
  };

  const openReset = (user: ManagedUser) => {
    setEditingUser(user);
    setForm({ ...EMPTY_FORM, generatePassword: true, mustChangePassword: true });
    setShowPassword(false);
    setModalMode("reset");
  };

  const closeModal = (force = false) => {
    if (busyId && !force) return;
    setModalMode(null);
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setShowPassword(false);
  };

  const saveUser = async (event: React.FormEvent) => {
    event.preventDefault();
    const actionId = editingUser?.id || "create";
    setBusyId(actionId);
    try {
      const endpoint = modalMode === "create" ? "/api/users" : `/api/users/${editingUser?.id}`;
      const method = modalMode === "create" ? "POST" : "PUT";
      const body =
        modalMode === "create"
          ? {
              name: form.name,
              email: form.email,
              role: form.role,
              password: form.password,
              generatePassword: form.generatePassword,
              mustChangePassword: form.mustChangePassword,
            }
          : {
              name: form.name,
              email: form.email,
              role: form.role,
              status: form.status,
              mustChangePassword: form.mustChangePassword,
            };

      const response = await apiFetch(endpoint, { method, body: JSON.stringify(body) });
      if (!response.ok) throw new Error(await readApiError(response));
      const result = await response.json();

      if (result.temporaryPassword) {
        setTemporaryPassword(result.temporaryPassword);
        setTemporaryPasswordEmail(result.user.email);
      }
      showNotification(modalMode === "create" ? "User created successfully." : "User updated successfully.", "success");
      closeModal(true);
      await refresh();
    } catch (error) {
      showNotification(error instanceof Error ? error.message : "Unable to save user.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const resetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingUser) return;
    setBusyId(editingUser.id);
    try {
      const response = await apiFetch(`/api/users/${editingUser.id}/reset-password`, {
        method: "POST",
        body: JSON.stringify({
          password: form.password,
          generatePassword: form.generatePassword,
          mustChangePassword: form.mustChangePassword,
        }),
      });
      if (!response.ok) throw new Error(await readApiError(response));
      const result = await response.json();
      setTemporaryPassword(result.temporaryPassword);
      setTemporaryPasswordEmail(result.user.email);
      showNotification("Password reset and previous sessions invalidated.", "success");
      closeModal(true);
      await refresh();
    } catch (error) {
      showNotification(error instanceof Error ? error.message : "Unable to reset password.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const changeStatus = async (user: ManagedUser) => {
    const nextStatus: UserStatus = user.status === "active" ? "inactive" : "active";
    const prompt = nextStatus === "inactive"
      ? `Deactivate ${user.name}? Their existing sessions will stop working immediately.`
      : `Activate ${user.name}?`;
    if (!window.confirm(prompt)) return;

    setBusyId(user.id);
    try {
      const response = await apiFetch(`/api/users/${user.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!response.ok) throw new Error(await readApiError(response));
      showNotification(`User ${nextStatus === "active" ? "activated" : "deactivated"}.`, "success");
      await refresh();
    } catch (error) {
      showNotification(error instanceof Error ? error.message : "Unable to update account status.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const unlockUser = async (user: ManagedUser) => {
    setBusyId(user.id);
    try {
      const response = await apiFetch(`/api/users/${user.id}/unlock`, { method: "POST" });
      if (!response.ok) throw new Error(await readApiError(response));
      showNotification("Account unlocked successfully.", "success");
      await refresh();
    } catch (error) {
      showNotification(error instanceof Error ? error.message : "Unable to unlock account.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const copyTemporaryPassword = async () => {
    if (!temporaryPassword) return;
    await navigator.clipboard.writeText(temporaryPassword);
    showNotification("Temporary password copied.", "success");
  };

  return (
    <div id="users-view" className="space-y-6 animate-fadeIn">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-300">Security administration</p>
          <h1 className="mt-1 text-2xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">User Management</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-300">Create accounts, assign roles, disable access, reset passwords, unlock users, and review security activity.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void refresh()} className="btn-secondary flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button type="button" onClick={openCreate} className="btn-primary flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold">
            <Plus className="h-4 w-4" /> Create User
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: Users, label: "Total Users", value: stats.total, className: "bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300" },
          { icon: UserCheck, label: "Active", value: stats.active, className: "bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300" },
          { icon: Ban, label: "Inactive", value: stats.inactive, className: "bg-rose-50 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300" },
          { icon: LockOpen, label: "Locked", value: stats.locked, className: "bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300" },
        ].map(({ icon: Icon, label, value, className }) => (
          <div key={label} className="glass-panel rounded-3xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">{label}</p>
                <p className="mt-2 text-3xl font-display font-extrabold text-slate-900 dark:text-white">{value}</p>
              </div>
              <div className={`grid h-12 w-12 place-items-center rounded-2xl ${className}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-panel overflow-hidden rounded-3xl">
        <div className="flex border-b border-slate-200 px-4 pt-4 dark:border-white/10">
          <button type="button" onClick={() => setActiveTab("users")} className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-extrabold ${activeTab === "users" ? "border-blue-600 text-blue-600 dark:text-blue-300" : "border-transparent text-slate-500"}`}>
            <UserCog className="h-4 w-4" /> Accounts
          </button>
          <button type="button" onClick={() => setActiveTab("audit")} className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-extrabold ${activeTab === "audit" ? "border-blue-600 text-blue-600 dark:text-blue-300" : "border-transparent text-slate-500"}`}>
            <Activity className="h-4 w-4" /> Security Audit
          </button>
        </div>

        {activeTab === "users" ? (
          <>
            <div className="grid gap-3 border-b border-slate-200 p-4 dark:border-white/10 md:grid-cols-[1fr_180px_180px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full py-2.5 pl-11 pr-4 text-sm" placeholder="Search name or email" />
              </div>
              <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as "all" | UserRole)} className="w-full px-3 py-2.5 text-sm">
                <option value="all">All roles</option>
                {ROLE_OPTIONS.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
              </select>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | UserStatus | "locked")} className="w-full px-3 py-2.5 text-sm">
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="locked">Locked</option>
              </select>
            </div>

            <div className="overflow-x-auto premium-scroll">
              <table className="min-w-[1040px]">
                <thead>
                  <tr>
                    <th className="px-5 py-4 text-left">User</th>
                    <th className="px-5 py-4 text-left">Role</th>
                    <th className="px-5 py-4 text-left">Status</th>
                    <th className="px-5 py-4 text-left">Last Login</th>
                    <th className="px-5 py-4 text-left">Password</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-t border-slate-100 dark:border-white/10">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-sm font-extrabold text-white">
                            {user.name.slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-extrabold text-slate-900 dark:text-white">{user.name}</p>
                              {user.id === currentUser?.id && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-extrabold uppercase text-blue-600 dark:bg-blue-400/10 dark:text-blue-300">You</span>}
                            </div>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-extrabold text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-200">{roleLabel(user.role)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${user.status === "active" ? "status-available" : "status-out"}`}>{user.status === "active" ? "Active" : "Inactive"}</span>
                          {user.isLocked && <span className="status-low rounded-full px-2.5 py-1 text-[10px] font-extrabold">Locked</span>}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600 dark:text-slate-300">{formatDate(user.lastLoginAt)}</td>
                      <td className="px-5 py-4">
                        <div className="text-xs text-slate-600 dark:text-slate-300">{formatDate(user.passwordChangedAt)}</div>
                        {user.mustChangePassword && <div className="mt-1 text-[10px] font-bold text-amber-600 dark:text-amber-300">Change required</div>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1.5">
                          <button type="button" onClick={() => openEdit(user)} disabled={busyId === user.id} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300" title="Edit user"><Edit3 className="h-4 w-4" /></button>
                          {user.id !== currentUser?.id && <button type="button" onClick={() => openReset(user)} disabled={busyId === user.id} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:text-amber-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300" title="Reset password"><KeyRound className="h-4 w-4" /></button>}
                          {user.isLocked && <button type="button" onClick={() => void unlockUser(user)} disabled={busyId === user.id} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300" title="Unlock account"><LockOpen className="h-4 w-4" /></button>}
                          {user.id !== currentUser?.id && <button type="button" onClick={() => void changeStatus(user)} disabled={busyId === user.id} className={`grid h-9 w-9 place-items-center rounded-xl border bg-white dark:bg-white/[0.04] ${user.status === "active" ? "border-rose-200 text-rose-600 dark:border-rose-400/20" : "border-emerald-200 text-emerald-600 dark:border-emerald-400/20"}`} title={user.status === "active" ? "Deactivate user" : "Activate user"}>{user.status === "active" ? <Ban className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!loading && filteredUsers.length === 0 && (
                    <tr><td colSpan={6} className="px-5 py-16 text-center text-sm text-slate-500">No users match the selected filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="overflow-x-auto premium-scroll">
            <table className="min-w-[1000px]">
              <thead>
                <tr>
                  <th className="px-5 py-4 text-left">Time</th>
                  <th className="px-5 py-4 text-left">Actor</th>
                  <th className="px-5 py-4 text-left">Action</th>
                  <th className="px-5 py-4 text-left">Target</th>
                  <th className="px-5 py-4 text-left">Result</th>
                  <th className="px-5 py-4 text-left">Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} className="border-t border-slate-100 dark:border-white/10">
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500 dark:text-slate-400">{formatDate(log.timestamp)}</td>
                    <td className="px-5 py-4 text-xs font-bold text-slate-700 dark:text-slate-200">{log.actor_email}</td>
                    <td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold uppercase text-slate-700 dark:bg-white/10 dark:text-slate-200">{log.action.replaceAll("_", " ")}</span></td>
                    <td className="px-5 py-4 text-xs text-slate-600 dark:text-slate-300">{log.target_email || "System"}</td>
                    <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${log.result === "success" ? "status-available" : "status-out"}`}>{log.result}</span></td>
                    <td className="max-w-md px-5 py-4 text-xs leading-5 text-slate-600 dark:text-slate-300">{log.details}</td>
                  </tr>
                ))}
                {!loading && auditLogs.length === 0 && <tr><td colSpan={6} className="px-5 py-16 text-center text-sm text-slate-500">No security audit events recorded yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalMode && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && closeModal()}>
          <div className="w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/20 bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-start justify-between border-b border-slate-200 p-6 dark:border-white/10">
              <div className="flex gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white">
                  {modalMode === "reset" ? <KeyRound className="h-5 w-5" /> : <UserCog className="h-5 w-5" />}
                </div>
                <div>
                  <h2 className="text-xl font-display font-extrabold text-slate-900 dark:text-white">{modalMode === "create" ? "Create User" : modalMode === "edit" ? "Edit User" : "Reset Password"}</h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{modalMode === "reset" ? editingUser?.email : "Account identity, role, and access settings"}</p>
                </div>
              </div>
              <button type="button" onClick={() => closeModal()} className="grid h-10 w-10 place-items-center rounded-2xl text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"><X className="h-4 w-4" /></button>
            </div>

            <form onSubmit={modalMode === "reset" ? resetPassword : saveUser} className="space-y-5 p-6">
              {modalMode !== "reset" && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block sm:col-span-2"><span className="mb-2 block text-xs font-extrabold text-slate-700 dark:text-slate-200">Full name</span><input value={form.name} onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))} className="w-full px-4 py-3" required /></label>
                    <label className="block sm:col-span-2"><span className="mb-2 block text-xs font-extrabold text-slate-700 dark:text-slate-200">Email address</span><input type="email" value={form.email} onChange={(event) => setForm((state) => ({ ...state, email: event.target.value }))} className="w-full px-4 py-3" placeholder="name@mjkhan.com" required /><p className="mt-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">Only @mjkhan.com email addresses are allowed.</p></label>
                    <label className="block"><span className="mb-2 block text-xs font-extrabold text-slate-700 dark:text-slate-200">Role</span><select value={form.role} onChange={(event) => setForm((state) => ({ ...state, role: event.target.value as UserRole }))} className="w-full px-4 py-3">{ROLE_OPTIONS.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select></label>
                    {modalMode === "edit" && <label className="block"><span className="mb-2 block text-xs font-extrabold text-slate-700 dark:text-slate-200">Status</span><select value={form.status} onChange={(event) => setForm((state) => ({ ...state, status: event.target.value as UserStatus }))} className="w-full px-4 py-3"><option value="active">Active</option><option value="inactive">Inactive</option></select></label>}
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-600 dark:bg-white/[0.04] dark:text-slate-300"><span className="font-extrabold">{roleLabel(form.role)}:</span> {ROLE_OPTIONS.find((role) => role.value === form.role)?.description}</div>
                </>
              )}

              {(modalMode === "create" || modalMode === "reset") && (
                <>
                  <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 p-4 dark:border-white/10"><input type="checkbox" checked={form.generatePassword} onChange={(event) => setForm((state) => ({ ...state, generatePassword: event.target.checked, password: event.target.checked ? "" : state.password }))} className="h-4 w-4" /><div><p className="text-sm font-extrabold text-slate-900 dark:text-white">Generate a secure temporary password</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">The password is shown once after saving.</p></div></label>
                  {!form.generatePassword && <label className="block"><span className="mb-2 block text-xs font-extrabold text-slate-700 dark:text-slate-200">Temporary password</span><div className="relative"><input type={showPassword ? "text" : "password"} value={form.password} onChange={(event) => setForm((state) => ({ ...state, password: event.target.value }))} className="w-full px-4 py-3 pr-12" minLength={6} required /><button type="button" onClick={() => setShowPassword((state) => !state)} className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div><p className="mt-2 text-[11px] text-slate-500">Minimum 6 characters. Uppercase letters, numbers, and symbols are optional.</p></label>}
                </>
              )}

              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 p-4 dark:border-white/10"><input type="checkbox" checked={form.mustChangePassword} onChange={(event) => setForm((state) => ({ ...state, mustChangePassword: event.target.checked }))} className="h-4 w-4" /><div><p className="text-sm font-extrabold text-slate-900 dark:text-white">Require password change at next sign-in</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Recommended for all administrator-issued passwords.</p></div></label>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5 dark:border-white/10">
                <button type="button" onClick={() => closeModal()} className="btn-secondary px-5 py-2.5 text-sm font-bold">Cancel</button>
                <button type="submit" disabled={Boolean(busyId)} className="btn-primary px-6 py-2.5 text-sm font-extrabold">{busyId ? "Saving..." : modalMode === "create" ? "Create User" : modalMode === "edit" ? "Save Changes" : "Reset Password"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {temporaryPassword && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/75 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] border border-emerald-200 bg-white p-7 shadow-2xl dark:border-emerald-400/20 dark:bg-slate-900">
            <div className="flex gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300"><ShieldCheck className="h-6 w-6" /></div>
              <div><h2 className="text-xl font-display font-extrabold text-slate-900 dark:text-white">Temporary password created</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Share it securely with {temporaryPasswordEmail}. It will not be shown again after closing.</p></div>
            </div>
            <div className="mt-6 flex items-center gap-3 rounded-2xl bg-slate-950 p-4 text-emerald-300"><code className="min-w-0 flex-1 break-all text-base font-bold tracking-wide">{temporaryPassword}</code><button type="button" onClick={() => void copyTemporaryPassword()} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 hover:bg-white/20" title="Copy password"><Clipboard className="h-4 w-4" /></button></div>
            <div className="mt-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><p className="text-xs leading-5">Do not send this password in a public group or store it in an unprotected document.</p></div>
            <button type="button" onClick={() => { setTemporaryPassword(null); setTemporaryPasswordEmail(""); }} className="btn-primary mt-6 w-full px-5 py-3 text-sm font-extrabold">I have saved the password</button>
          </div>
        </div>
      )}

      {notification && (
        <div className="fixed bottom-5 right-5 z-[100] max-w-sm">
          <div className={`flex gap-3 rounded-2xl border bg-white p-4 text-sm font-semibold shadow-2xl dark:bg-slate-900 ${notification.type === "success" ? "border-emerald-200 text-emerald-700 dark:border-emerald-400/20 dark:text-emerald-200" : "border-rose-200 text-rose-700 dark:border-rose-400/20 dark:text-rose-200"}`}>
            {notification.type === "success" ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
            {notification.message}
          </div>
        </div>
      )}
    </div>
  );
}