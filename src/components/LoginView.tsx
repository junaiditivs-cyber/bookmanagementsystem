import { useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Moon,
  ShieldCheck,
  Sun,
  UserRound,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";

const ALLOWED_EMAIL_SUFFIX = "@mjkhan.com";

function isAllowedLoginEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(ALLOWED_EMAIL_SUFFIX);
}

export default function LoginView() {
  const { login, initialized } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">(
    document.documentElement.classList.contains("dark") ? "dark" : "light",
  );

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.classList.toggle("light", next === "light");
    document.documentElement.setAttribute("data-theme", next);
    document.documentElement.style.colorScheme = next;
    localStorage.setItem("theme", next);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!isAllowedLoginEmail(normalizedEmail)) {
      setError(`Only ${ALLOWED_EMAIL_SUFFIX} email addresses are allowed.`);
      return;
    }

    setSubmitting(true);
    try {
      await login({
        email: normalizedEmail,
        password,
        rememberMe,
      });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Sign in failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen premium-app-bg flex items-center justify-center px-4 py-8 text-slate-800 dark:text-slate-100">
      <button
        type="button"
        onClick={toggleTheme}
        className="premium-theme-toggle fixed right-5 top-5 z-20"
        aria-label="Toggle color theme"
      >
        {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-blue-600" />}
        <span>{theme === "dark" ? "Light" : "Dark"}</span>
      </button>

      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-2xl dark:border-white/10 dark:bg-slate-900/90 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden min-h-[680px] overflow-hidden bg-gradient-to-br from-[#0B1F4D] via-[#312E81] to-[#701A75] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-20 h-80 w-80 rounded-full bg-fuchsia-400/20 blur-3xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border border-white/25 bg-white/15 p-2 shadow-xl">
                <BookOpen className="absolute h-8 w-8 text-white/80" />
                <img src="/ivs-logo.png" alt="IVS logo" className="relative z-10 h-full w-full object-contain" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-cyan-200">Secure Workspace</p>
                <h1 className="mt-1 text-3xl font-display font-extrabold !text-white">IVS Books Management</h1>
              </div>
            </div>

            <p className="mt-10 max-w-md text-sm leading-7 text-slate-200">
              Controlled access for stock, sales, reporting, settings, and administration with session-based security and role permissions.
            </p>
          </div>

          <div className="relative z-10 space-y-4">
            {[
              [ShieldCheck, "Role-based authorization", "Every protected API validates the signed-in user's permission."],
              [LockKeyhole, "Secure password storage", "Passwords are stored as memory-hard hashes, never as readable text."],
              [CheckCircle2, "Immediate session invalidation", "Password, role, or account changes invalidate older sessions."],
            ].map(([Icon, title, description]) => (
              <div key={String(title)} className="flex gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/15">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{title as string}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-300">{description as string}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="flex min-h-[620px] items-center p-6 sm:p-10 lg:p-12">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 p-1.5 shadow-lg">
                  <img src="/ivs-logo.png" alt="IVS logo" className="h-full w-full object-contain" />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-300">Secure Workspace</p>
                  <h1 className="text-xl font-display font-extrabold text-slate-900 dark:text-white">IVS Books Management</h1>
                </div>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-blue-600 dark:text-blue-300">Account access</p>
              <h2 className="mt-2 text-3xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">Sign in to continue</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">Use the account created for you by the system administrator.</p>
            </div>

            {!initialized && (
              <div className="mt-6 rounded-2xl border border-amber-300/70 bg-amber-50 p-4 text-amber-900 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-100">
                <div className="flex gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="text-sm font-extrabold">First administrator is not created</p>
                    <p className="mt-1 text-xs leading-5">Run this command in the project terminal, then reload:</p>
                    <code className="mt-2 block rounded-xl bg-slate-950 px-3 py-2 text-[11px] text-emerald-300">npm run auth:create-admin</code>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-6 flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-sm font-semibold">{error}</p>
              </div>
            )}

            <form className="mt-7 space-y-5" onSubmit={submit}>
              <label className="block">
                <span className="mb-2 block text-xs font-extrabold text-slate-700 dark:text-slate-200">Email address</span>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full py-3.5 pl-11 pr-4"
                    placeholder="name@mjkhan.com"
                    required
                    disabled={!initialized || submitting}
                  />
                </div>
                <p className="mt-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Only @mjkhan.com email addresses can sign in.
                </p>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-extrabold text-slate-700 dark:text-slate-200">Password</span>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full py-3.5 pl-11 pr-12"
                    placeholder="Enter your password"
                    required
                    disabled={!initialized || submitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                  disabled={!initialized || submitting}
                />
                Keep me signed in on this device
              </label>

              <button
                type="submit"
                disabled={!initialized || submitting}
                className="btn-primary flex w-full items-center justify-center gap-2 px-5 py-3.5 text-sm font-extrabold"
              >
                <ShieldCheck className="h-4 w-4" />
                {submitting ? "Signing in..." : "Sign in securely"}
              </button>
            </form>

            <p className="mt-7 text-center text-[11px] leading-5 text-slate-400">Access attempts are rate-limited and recorded in the security audit log.</p>
          </div>
        </section>
      </div>
    </div>
  );
}