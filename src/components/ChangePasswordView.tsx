import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, LockKeyhole, X } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

interface ChangePasswordViewProps {
  forced?: boolean;
  onClose?: () => void;
}

export default function ChangePasswordView({ forced = false, onClose }: ChangePasswordViewProps) {
  const { changePassword, logout, user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const checks = useMemo(
    () => [
      ["At least 6 characters", newPassword.length >= 6],
      ["Passwords match", Boolean(newPassword) && newPassword === confirmPassword],
    ] as const,
    [newPassword, confirmPassword],
  );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await changePassword({ currentPassword, newPassword, confirmPassword });
      setSuccess("Password changed successfully. Existing sessions have been invalidated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      if (!forced) setTimeout(() => onClose?.(), 900);
    } catch (changeError) {
      setError(changeError instanceof Error ? changeError.message : "Password change failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const content = (
    <div className="w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-900">
      <div className="border-b border-slate-200 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 text-white dark:border-white/10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-blue-100">Account security</p>
              <h2 className="mt-1 text-2xl font-display font-extrabold !text-white">{forced ? "Create a new password" : "Change password"}</h2>
              <p className="mt-1 text-xs leading-5 text-blue-100">Signed in as {user?.email}</p>
            </div>
          </div>
          {!forced && onClose && (
            <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 hover:bg-white/20" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {forced && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
            <div className="flex gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="text-sm leading-6">Your administrator issued a temporary password. You must replace it before accessing the system.</p>
            </div>
          </div>
        )}

        <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-100">
          Your new password only needs at least 6 characters. Uppercase letters, numbers, and symbols are optional.
        </div>

        {error && <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">{error}</div>}
        {success && <div className="mb-5 flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200"><CheckCircle2 className="h-5 w-5 shrink-0" />{success}</div>}

        <form onSubmit={submit} className="space-y-5">
          {[
            ["Current password", currentPassword, setCurrentPassword, "current-password"],
            ["New password", newPassword, setNewPassword, "new-password"],
            ["Confirm new password", confirmPassword, setConfirmPassword, "new-password"],
          ].map(([label, value, setter, autoComplete]) => (
            <label key={label as string} className="block">
              <span className="mb-2 block text-xs font-extrabold text-slate-700 dark:text-slate-200">{label as string}</span>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPasswords ? "text" : "password"}
                  value={value as string}
                  onChange={(event) => (setter as React.Dispatch<React.SetStateAction<string>>)(event.target.value)}
                  autoComplete={autoComplete as string}
                  className="w-full py-3 pl-11 pr-12"
                  required
                  disabled={submitting}
                />
                <button type="button" onClick={() => setShowPasswords((state) => !state)} className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Toggle password visibility">
                  {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>
          ))}

          <div className="grid gap-2 rounded-2xl bg-slate-50 p-4 dark:bg-white/[0.04] sm:grid-cols-2">
            {checks.map(([label, passed]) => (
              <div key={label} className={`flex items-center gap-2 text-xs font-semibold ${passed ? "text-emerald-600 dark:text-emerald-300" : "text-slate-500 dark:text-slate-400"}`}>
                <CheckCircle2 className="h-4 w-4" />
                {label}
              </div>
            ))}
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {forced ? (
              <button type="button" onClick={() => void logout()} className="btn-secondary px-5 py-3 text-sm font-bold">Sign out</button>
            ) : (
              <button type="button" onClick={onClose} className="btn-secondary px-5 py-3 text-sm font-bold">Cancel</button>
            )}
            <button type="submit" disabled={submitting || checks.some(([, passed]) => !passed)} className="btn-primary px-6 py-3 text-sm font-extrabold">
              {submitting ? "Updating..." : "Update password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (forced) {
    return <div className="min-h-screen premium-app-bg flex items-center justify-center px-4 py-8">{content}</div>;
  }

  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">{content}</div>;
}