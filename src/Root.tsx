import {
  BookOpen,
} from "lucide-react";

import App from "./App";

import {
  useAuth,
} from "./auth/AuthContext";

import ChangePasswordView from "./components/ChangePasswordView";
import LoginView from "./components/LoginView";

function AuthLoadingScreen() {
  return (
    <div className="min-h-screen premium-app-bg flex flex-col items-center justify-center gap-5">
      <div className="grid h-20 w-20 place-items-center rounded-[1.75rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 shadow-2xl">
        <BookOpen className="h-9 w-9 text-white" />
      </div>

      <div className="text-center">
        <p className="text-sm font-display font-extrabold text-slate-900 dark:text-white">
          IVS Books Management
        </p>

        <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.22em] text-slate-400">
          Verifying secure session...
        </p>
      </div>
    </div>
  );
}

export default function Root() {
  const {
    user,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <AuthLoadingScreen />
    );
  }

  if (!user) {
    return <LoginView />;
  }

  if (
    user.mustChangePassword
  ) {
    return (
      <ChangePasswordView
        forced
      />
    );
  }

  return <App />;
}