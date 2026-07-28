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

const INPUT_CLASS =
  "login-control h-12 w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm font-bold text-slate-950 shadow-sm outline-none transition placeholder:text-slate-500 hover:border-amber-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-[#10263c] dark:text-white dark:placeholder:text-slate-400 dark:hover:border-amber-300/40 dark:focus:border-amber-300 dark:focus:ring-amber-300/10 dark:[color-scheme:dark]";

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
    document.documentElement.classList.contains("dark")
      ? "dark"
      : "light",
  );

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";

    setTheme(next);
    document.documentElement.classList.toggle(
      "dark",
      next === "dark",
    );
    document.documentElement.classList.toggle(
      "light",
      next === "light",
    );
    document.documentElement.setAttribute("data-theme", next);
    document.documentElement.style.colorScheme = next;
    localStorage.setItem("theme", next);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!isAllowedLoginEmail(normalizedEmail)) {
      setError(
        `Only ${ALLOWED_EMAIL_SUFFIX} email addresses are allowed.`,
      );
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
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Sign in failed.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const securityFeatures = [
    {
      icon: ShieldCheck,
      title: "Role-based authorization",
      description:
        "Every protected API validates the signed-in user's permission.",
    },
    {
      icon: LockKeyhole,
      title: "Secure password storage",
      description:
        "Passwords are stored as memory-hard hashes, never as readable text.",
    },
    {
      icon: CheckCircle2,
      title: "Immediate session invalidation",
      description:
        "Password, role, or account changes invalidate older sessions.",
    },
  ];

  return (
    <div
      id="login-view"
      className="premium-app-bg flex min-h-screen items-center justify-center px-4 py-8 text-slate-950 dark:text-slate-100"
    >
      <style>{`
        #login-view .login-readable {
          color: #0f172a !important;
        }

        #login-view .login-muted {
          color: #475569 !important;
        }

        #login-view .login-shell {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
        }

        #login-view .login-form-panel {
          background-color: #ffffff !important;
        }

        #login-view .login-control {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }

        #login-view .login-control::placeholder {
          color: #64748b !important;
          opacity: 1 !important;
        }

        html.dark #login-view .login-readable {
          color: #f8fafc !important;
        }

        html.dark #login-view .login-muted {
          color: #cbd5e1 !important;
        }

        html.dark #login-view .login-shell {
          background-color: #081827 !important;
          border-color: rgba(252, 211, 77, 0.22) !important;
        }

        html.dark #login-view .login-form-panel {
          background-color: #081827 !important;
        }

        html.dark #login-view .login-control {
          background-color: #10263c !important;
          border-color: rgba(255, 255, 255, 0.16) !important;
          color: #ffffff !important;
        }

        html.dark #login-view .login-control::placeholder {
          color: #94a3b8 !important;
          opacity: 1 !important;
        }
      `}</style>

      <button
        type="button"
        onClick={toggleTheme}
        className="
          fixed right-5 top-5 z-20 inline-flex items-center gap-2
          rounded-2xl border border-slate-300 bg-white px-4 py-2.5
          text-xs font-extrabold text-slate-800 shadow-lg
          transition hover:border-amber-400 hover:bg-amber-50
          hover:text-amber-800
          dark:border-amber-300/20 dark:bg-[#10263c]
          dark:text-slate-100 dark:hover:border-amber-300/40
          dark:hover:bg-amber-300/10 dark:hover:text-amber-200
        "
        aria-label="Toggle color theme"
      >
        {theme === "dark" ? (
          <Sun className="h-4 w-4 text-amber-300" />
        ) : (
          <Moon className="h-4 w-4 text-slate-700" />
        )}

        <span>{theme === "dark" ? "Light" : "Dark"}</span>
      </button>

      <div
        className="
          login-shell grid w-full max-w-5xl overflow-hidden
          rounded-[2rem] border border-slate-300 bg-white
          shadow-[0_32px_100px_rgba(15,23,42,0.22)]
          dark:border-amber-300/20 dark:bg-[#081827]
          dark:shadow-[0_38px_120px_rgba(0,0,0,0.62)]
          lg:grid-cols-[1.05fr_0.95fr]
        "
      >
        <section
          className="
            relative hidden min-h-[680px] overflow-hidden
            border-r border-amber-300/15
            bg-[#081827] p-10 text-white
            lg:flex lg:flex-col lg:justify-between
          "
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.20),transparent_38%)]" />
          <div className="pointer-events-none absolute -right-24 top-20 h-64 w-64 rounded-full border border-amber-300/15" />
          <div className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-amber-300/10 blur-3xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-4">
              <div
                className="
                  relative flex h-20 w-20 shrink-0 items-center
                  justify-center overflow-hidden rounded-3xl
                  border border-amber-300/30 bg-white/10 p-2
                  shadow-[0_16px_38px_rgba(0,0,0,0.28)]
                "
              >
                <BookOpen className="absolute h-8 w-8 text-amber-200/70" />

                <img
                  src="/ivs-logo.png"
                  alt="IVS logo"
                  className="relative z-10 h-full w-full object-contain"
                />
              </div>

              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-amber-200">
                  Secure Workspace
                </p>

                <h1 className="mt-1 font-display text-3xl font-extrabold text-[#f7ddb0]">
                  IVS Books Management
                </h1>
              </div>
            </div>

            <p className="mt-10 max-w-md text-sm font-semibold leading-7 text-slate-300">
              Controlled access for stock, sales, reporting,
              settings, and administration with session-based
              security and role permissions.
            </p>
          </div>

          <div className="relative z-10 space-y-4">
            {securityFeatures.map(
              ({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="
                    flex gap-3 rounded-2xl border
                    border-white/10 bg-[#10263c] p-4
                    shadow-[0_10px_30px_rgba(0,0,0,0.18)]
                  "
                >
                  <div
                    className="
                      grid h-10 w-10 shrink-0 place-items-center
                      rounded-2xl border border-amber-300/20
                      bg-amber-300/10 text-amber-300
                    "
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm font-extrabold text-white">
                      {title}
                    </p>

                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-300">
                      {description}
                    </p>
                  </div>
                </div>
              ),
            )}
          </div>
        </section>

        <section
          className="
            login-form-panel flex min-h-[620px] items-center
            bg-white p-6 sm:p-10 lg:p-12
            dark:bg-[#081827]
          "
        >
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <div className="flex items-center gap-3">
                <div
                  className="
                    flex h-14 w-14 items-center justify-center
                    overflow-hidden rounded-2xl border
                    border-amber-300 bg-amber-50 p-1.5
                    shadow-lg
                    dark:border-amber-300/25
                    dark:bg-amber-300/10
                  "
                >
                  <img
                    src="/ivs-logo.png"
                    alt="IVS logo"
                    className="h-full w-full object-contain"
                  />
                </div>

                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-amber-800 dark:text-amber-200">
                    Secure Workspace
                  </p>

                  <h1 className="login-readable font-display text-xl font-extrabold text-slate-950 dark:text-[#f7ddb0]">
                    IVS Books Management
                  </h1>
                </div>
              </div>
            </div>

            <div>
              <div
                className="
                  inline-flex items-center gap-2 rounded-full
                  border border-amber-300 bg-amber-50 px-3 py-1
                  text-[9px] font-black uppercase tracking-[0.22em]
                  text-amber-800
                  dark:border-amber-300/25
                  dark:bg-amber-300/10 dark:text-amber-200
                "
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Account access
              </div>

              <h2 className="login-readable mt-3 font-display text-3xl font-extrabold tracking-tight text-slate-950 dark:text-[#f7ddb0]">
                Sign in to continue
              </h2>

              <p className="login-muted mt-2 text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">
                Use the account created for you by the system
                administrator.
              </p>
            </div>

            {!initialized && (
              <div
                className="
                  mt-6 rounded-2xl border border-amber-300
                  bg-amber-50 p-4 text-amber-950
                  dark:border-amber-300/25
                  dark:bg-amber-300/10 dark:text-amber-100
                "
              >
                <div className="flex gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" />

                  <div>
                    <p className="text-sm font-extrabold">
                      First administrator is not created
                    </p>

                    <p className="mt-1 text-xs font-semibold leading-5">
                      Run this command in the project terminal, then
                      reload:
                    </p>

                    <code
                      className="
                        mt-3 block overflow-x-auto rounded-xl
                        border border-white/10 bg-slate-950
                        px-3 py-2 text-[11px] font-bold
                        text-emerald-300
                      "
                    >
                      npm run auth:create-admin
                    </code>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div
                className="
                  mt-6 flex gap-3 rounded-2xl border
                  border-rose-200 bg-rose-50 p-4
                  text-rose-800
                  dark:border-rose-400/20
                  dark:bg-rose-400/10 dark:text-rose-200
                "
              >
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

                <p className="text-sm font-bold leading-6">
                  {error}
                </p>
              </div>
            )}

            <form
              className="mt-7 space-y-5"
              onSubmit={submit}
            >
              <label className="block">
                <span className="login-readable mb-2 block text-xs font-extrabold text-slate-900 dark:text-slate-100">
                  Email address
                </span>

                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />

                  <input
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    className={INPUT_CLASS}
                    placeholder="name@mjkhan.com"
                    required
                    disabled={!initialized || submitting}
                  />
                </div>

                <p className="login-muted mt-2 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Only {ALLOWED_EMAIL_SUFFIX} email addresses can
                  sign in.
                </p>
              </label>

              <label className="block">
                <span className="login-readable mb-2 block text-xs font-extrabold text-slate-900 dark:text-slate-100">
                  Password
                </span>

                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />

                  <input
                    type={
                      showPassword ? "text" : "password"
                    }
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    className={`${INPUT_CLASS} pr-12`}
                    placeholder="Enter your password"
                    required
                    disabled={!initialized || submitting}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((value) => !value)
                    }
                    className="
                      absolute right-3 top-1/2 grid h-9 w-9
                      -translate-y-1/2 place-items-center
                      rounded-xl text-slate-500 transition
                      hover:bg-slate-100 hover:text-slate-900
                      dark:text-slate-400
                      dark:hover:bg-white/10 dark:hover:text-white
                    "
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </label>

              <label className="login-muted flex cursor-pointer items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) =>
                    setRememberMe(event.target.checked)
                  }
                  className="
                    h-4 w-4 rounded border-slate-300
                    text-amber-600 focus:ring-amber-500
                    dark:border-white/20 dark:bg-[#10263c]
                  "
                  disabled={!initialized || submitting}
                />

                Keep me signed in on this device
              </label>

              <button
                type="submit"
                disabled={!initialized || submitting}
                className="
                  inline-flex w-full items-center justify-center
                  gap-2 rounded-2xl border border-amber-400
                  bg-[linear-gradient(135deg,#8a5a11_0%,#c58a26_50%,#f0c667_100%)]
                  px-5 py-3.5 text-sm font-extrabold
                  text-slate-950
                  shadow-[0_14px_32px_rgba(180,123,24,0.24)]
                  transition hover:-translate-y-0.5
                  hover:brightness-105
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  disabled:hover:translate-y-0
                  dark:border-amber-300/40
                  dark:text-[#081827]
                "
              >
                <ShieldCheck className="h-4 w-4" />

                {submitting
                  ? "Signing in..."
                  : "Sign in securely"}
              </button>
            </form>

            <p className="login-muted mt-7 text-center text-[11px] font-semibold leading-5 text-slate-500 dark:text-slate-400">
              Access attempts are rate-limited and recorded in the
              security audit log.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}