import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  LogOut,
  ShieldCheck,
  X,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";

import ScreenModalPortal from "./ui/ScreenModalPortal";
const CHANGE_PASSWORD_VIEW_THEME_GUARD = `
html.dark #change-password-view {
  color: #e8eef7 !important;
}
html.dark #change-password-view [class*="text-slate-"] {
  color: #d9e4ef !important;
}
html.dark #change-password-view [class*="dark:text-white"] {
  color: #ffffff !important;
}
html.dark #change-password-view [class*="dark:text-[#f7ddb0]"] {
  color: #f7ddb0 !important;
}
html.dark #change-password-view [class*="dark:text-[#081827]"] {
  color: #081827 !important;
}
html.dark #change-password-view [class*="dark:text-amber-"] {
  color: #f4d88a !important;
}
html.dark #change-password-view [class*="dark:text-blue-"] {
  color: #bfdbfe !important;
}
html.dark #change-password-view [class*="dark:text-emerald-"] {
  color: #a7f3d0 !important;
}
html.dark #change-password-view [class*="dark:text-rose-"] {
  color: #fecdd3 !important;
}
html.dark #change-password-view [class*="dark:bg-white/"] ,
html.dark #change-password-view [class*="dark:bg-white["] ,
html.dark #change-password-view [class*="bg-white/"] {
  background-color: #10263c !important;
}
html.dark #change-password-view [class*="bg-slate-50"] {
  background-color: #10263c !important;
}
html.dark #change-password-view [class*="dark:bg-[#081827]"] {
  background-color: #081827 !important;
}
html.dark #change-password-view [class*="dark:bg-[#10263c]"] {
  background-color: #10263c !important;
}
html.dark #change-password-view [class*="dark:bg-amber-"] {
  background-color: rgba(245, 208, 121, 0.12) !important;
}
html.dark #change-password-view [class*="dark:bg-blue-"] {
  background-color: rgba(59, 130, 246, 0.14) !important;
}
html.dark #change-password-view [class*="dark:bg-emerald-"] {
  background-color: rgba(16, 185, 129, 0.14) !important;
}
html.dark #change-password-view [class*="dark:bg-rose-"] {
  background-color: rgba(244, 63, 94, 0.14) !important;
}
html.dark #change-password-view [class*="border-white/"] {
  border-color: rgba(247, 221, 176, 0.22) !important;
}
html.dark #change-password-view input,
html.dark #change-password-view select,
html.dark #change-password-view textarea {
  background-color: #10263c !important;
  color: #ffffff !important;
  border-color: rgba(247, 221, 176, 0.34) !important;
  caret-color: #f7ddb0 !important;
}
html.dark #change-password-view input::placeholder,
html.dark #change-password-view textarea::placeholder {
  color: #a9b8c8 !important;
  opacity: 1 !important;
}
html.dark #change-password-view select option {
  background-color: #10263c !important;
  color: #ffffff !important;
}
html:not(.dark) #change-password-view {
  color: #0f172a !important;
}
html:not(.dark) #change-password-view [class*="bg-white/"] {
  background-color: #ffffff !important;
}
html:not(.dark) #change-password-view [class*="border-white/"] {
  border-color: #cbd5e1 !important;
}
html:not(.dark) #change-password-view input,
html:not(.dark) #change-password-view select,
html:not(.dark) #change-password-view textarea {
  background-color: #ffffff !important;
  color: #0f172a !important;
  border-color: #cbd5e1 !important;
}
html:not(.dark) #change-password-view input::placeholder,
html:not(.dark) #change-password-view textarea::placeholder {
  color: #64748b !important;
  opacity: 1 !important;
}
`;

interface ChangePasswordViewProps {
  forced?: boolean;
  onClose?: () => void;
}

export default function ChangePasswordView({
  forced = false,
  onClose,
}: ChangePasswordViewProps) {
  const { changePassword, logout, user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const checks = useMemo(
    () =>
      [
        ["At least 6 characters", newPassword.length >= 6],
        [
          "Passwords match",
          Boolean(newPassword) && newPassword === confirmPassword,
        ],
      ] as const,
    [newPassword, confirmPassword],
  );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setSuccess(
        "Password changed successfully. Existing sessions have been invalidated.",
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      if (!forced) {
        setTimeout(() => onClose?.(), 900);
      }
    } catch (changeError) {
      setError(
        changeError instanceof Error
          ? changeError.message
          : "Password change failed.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const passwordFields = [
    {
      label: "Current password",
      value: currentPassword,
      setter: setCurrentPassword,
      autoComplete: "current-password",
    },
    {
      label: "New password",
      value: newPassword,
      setter: setNewPassword,
      autoComplete: "new-password",
    },
    {
      label: "Confirm new password",
      value: confirmPassword,
      setter: setConfirmPassword,
      autoComplete: "new-password",
    },
  ];

  const content = (
    <div
      id="change-password-view"
      className="
        relative w-full max-w-xl overflow-hidden rounded-[2rem]
        border border-amber-200/80 bg-white
        shadow-[0_28px_90px_rgba(15,23,42,0.20)]
        dark:border-amber-400/20 dark:bg-[#081827]
        dark:shadow-[0_30px_100px_rgba(0,0,0,0.55)]
      "
    >
      <style>{CHANGE_PASSWORD_VIEW_THEME_GUARD}</style>

      <div
        className="
          relative overflow-hidden border-b border-amber-200/80
          bg-[linear-gradient(135deg,#fffdf8_0%,#fff8e8_52%,#eef4ff_100%)]
          px-6 py-6
          dark:border-amber-400/15
          dark:bg-[linear-gradient(135deg,#081827_0%,#0c2238_55%,#10283f_100%)]
          sm:px-8 sm:py-7
        "
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full border border-amber-300/20" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-amber-300/10 blur-3xl" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex min-w-0 gap-4">
            <div
              className="
                grid h-12 w-12 shrink-0 place-items-center rounded-2xl
                border border-amber-300/70 bg-white text-amber-700
                shadow-[0_10px_24px_rgba(180,123,24,0.15)]
                dark:border-amber-300/30 dark:bg-amber-300/10
                dark:text-amber-300
              "
            >
              <KeyRound className="h-6 w-6" />
            </div>

            <div className="min-w-0">
              <div
                className="
                  inline-flex items-center gap-2 rounded-full
                  border border-amber-300/70 bg-amber-50 px-3 py-1
                  text-[9px] font-black uppercase tracking-[0.22em]
                  text-amber-800
                  dark:border-amber-300/25 dark:bg-amber-300/10
                  dark:text-amber-200
                "
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Account security
              </div>

              <h2
                className="
                  mt-3 font-display text-2xl font-extrabold tracking-tight
                  text-slate-950 dark:text-[#f7ddb0]
                "
              >
                {forced ? "Create a new password" : "Change password"}
              </h2>

              <p className="mt-1 break-all text-xs font-semibold leading-5 text-slate-600 dark:text-slate-300">
                Signed in as {user?.email}
              </p>
            </div>
          </div>

          {!forced && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="
                grid h-10 w-10 shrink-0 place-items-center rounded-2xl
                border border-slate-200 bg-white text-slate-600 shadow-sm
                transition hover:border-amber-300 hover:bg-amber-50
                hover:text-amber-700
                dark:border-white/10 dark:bg-white/[0.05]
                dark:text-slate-300 dark:hover:border-amber-300/30
                dark:hover:bg-amber-300/10 dark:hover:text-amber-200
              "
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div
        className="
          max-h-[calc(100vh-12rem)] overflow-y-auto
          bg-white p-6 text-slate-900
          dark:bg-[#081827] dark:text-slate-100
          sm:p-8
        "
      >
        {forced && (
          <div
            className="
              mb-6 rounded-2xl border border-amber-300
              bg-amber-50 p-4 text-amber-950
              dark:border-amber-300/25 dark:bg-amber-300/10
              dark:text-amber-100
            "
          >
            <div className="flex gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" />
              <p className="text-sm font-semibold leading-6">
                Your administrator issued a temporary password. You must
                replace it before accessing the system.
              </p>
            </div>
          </div>
        )}

        <div
          className="
            mb-5 rounded-2xl border border-blue-200
            bg-blue-50 p-4 text-sm font-semibold leading-6 text-blue-950
            dark:border-blue-400/20 dark:bg-blue-400/10
            dark:text-blue-100
          "
        >
          Your new password only needs at least 6 characters. Uppercase
          letters, numbers, and symbols are optional.
        </div>

        {error && (
          <div
            className="
              mb-5 rounded-2xl border border-rose-200
              bg-rose-50 p-4 text-sm font-bold leading-6 text-rose-800
              dark:border-rose-400/20 dark:bg-rose-400/10
              dark:text-rose-200
            "
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="
              mb-5 flex gap-3 rounded-2xl border border-emerald-200
              bg-emerald-50 p-4 text-sm font-bold leading-6
              text-emerald-800
              dark:border-emerald-400/20 dark:bg-emerald-400/10
              dark:text-emerald-200
            "
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={submit} className="space-y-5">
          {passwordFields.map(({ label, value, setter, autoComplete }) => (
            <label key={label} className="block">
              <span className="mb-2 block text-xs font-extrabold text-slate-800 dark:text-slate-200">
                {label}
              </span>

              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />

                <input
                  type={showPasswords ? "text" : "password"}
                  value={value}
                  onChange={(event) => setter(event.target.value)}
                  autoComplete={autoComplete}
                  className="
                    h-12 w-full rounded-2xl border border-slate-300
                    bg-white py-3 pl-11 pr-12 text-sm font-bold
                    text-slate-950 shadow-sm outline-none transition
                    placeholder:text-slate-400
                    hover:border-amber-400
                    focus:border-amber-500 focus:ring-4
                    focus:ring-amber-500/10
                    disabled:cursor-not-allowed disabled:opacity-60
                    dark:border-white/15 dark:bg-white/[0.06]
                    dark:text-white dark:placeholder:text-slate-500
                    dark:hover:border-amber-300/40
                    dark:focus:border-amber-300
                    dark:focus:ring-amber-300/10
                  "
                  required
                  disabled={submitting}
                />

                <button
                  type="button"
                  onClick={() => setShowPasswords((state) => !state)}
                  className="
                    absolute right-3 top-1/2 grid h-9 w-9
                    -translate-y-1/2 place-items-center rounded-xl
                    text-slate-500 transition hover:bg-slate-100
                    hover:text-slate-900
                    dark:text-slate-400 dark:hover:bg-white/10
                    dark:hover:text-white
                  "
                  aria-label="Toggle password visibility"
                >
                  {showPasswords ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </label>
          ))}

          <div
            className="
              grid gap-2 rounded-2xl border border-slate-200
              bg-slate-50 p-4
              dark:border-white/10 dark:bg-white/[0.04]
              sm:grid-cols-2
            "
          >
            {checks.map(([label, passed]) => (
              <div
                key={label}
                className={`flex items-center gap-2 text-xs font-bold ${
                  passed
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                <CheckCircle2
                  className={`h-4 w-4 ${
                    passed
                      ? "text-emerald-600 dark:text-emerald-300"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                />
                {label}
              </div>
            ))}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-white/10 sm:flex-row sm:justify-end">
            {forced ? (
              <button
                type="button"
                onClick={() => void logout()}
                className="
                  inline-flex items-center justify-center gap-2 rounded-2xl
                  border border-slate-300 bg-white px-5 py-3
                  text-sm font-extrabold text-slate-800 shadow-sm
                  transition hover:border-rose-300 hover:bg-rose-50
                  hover:text-rose-700
                  dark:border-white/15 dark:bg-white/[0.05]
                  dark:text-slate-200 dark:hover:border-rose-300/30
                  dark:hover:bg-rose-400/10 dark:hover:text-rose-200
                "
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="
                  inline-flex items-center justify-center rounded-2xl
                  border border-slate-300 bg-white px-5 py-3
                  text-sm font-extrabold text-slate-800 shadow-sm
                  transition hover:border-slate-400 hover:bg-slate-100
                  dark:border-white/15 dark:bg-white/[0.05]
                  dark:text-slate-200 dark:hover:bg-white/10
                "
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={
                submitting || checks.some(([, passed]) => !passed)
              }
              className="
                inline-flex items-center justify-center gap-2 rounded-2xl
                border border-amber-400
                bg-[linear-gradient(135deg,#8a5a11_0%,#c58a26_50%,#f0c667_100%)]
                px-6 py-3 text-sm font-extrabold text-slate-950
                shadow-[0_12px_30px_rgba(180,123,24,0.24)]
                transition hover:-translate-y-0.5 hover:brightness-105
                disabled:cursor-not-allowed disabled:opacity-45
                disabled:hover:translate-y-0
                dark:border-amber-300/40
                dark:text-[#081827]
              "
            >
              <ShieldCheck className="h-4 w-4" />
              {submitting ? "Updating..." : "Update password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (forced) {
    return (
      <div className="premium-app-bg flex min-h-screen items-center justify-center px-4 py-8">
        {content}
      </div>
    );
  }

  return (
    <ScreenModalPortal>
      {content}
    </ScreenModalPortal>
  );
}
