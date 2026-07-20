import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  apiFetch,
  readApiError,
  setCsrfToken,
} from "../api/http";

import type {
  AuthUser,
} from "./types";

interface LoginInput {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;

  login: (
    input: LoginInput,
  ) => Promise<void>;

  logout: () => Promise<void>;

  changePassword: (
    input: ChangePasswordInput,
  ) => Promise<void>;

  refreshSession: () => Promise<void>;

  hasPermission: (
    permission: string,
  ) => boolean;
}

const AuthContext =
  createContext<AuthContextValue | null>(
    null,
  );

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [
    user,
    setUser,
  ] = useState<AuthUser | null>(
    null,
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    initialized,
    setInitialized,
  ] = useState(true);

  const refreshSession =
    useCallback(async () => {
      try {
        const response =
          await apiFetch(
            "/api/auth/me",
          );

        if (
          response.status === 401
        ) {
          setUser(null);
          setCsrfToken(null);
          return;
        }

        if (!response.ok) {
          throw new Error(
            await readApiError(
              response,
            ),
          );
        }

        const body =
          await response.json();

        setUser(body.user);

        setCsrfToken(
          body.csrfToken ||
            null,
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    let active = true;

    const initialize =
      async () => {
        try {
          const statusResponse =
            await fetch(
              "/api/auth/bootstrap-status",
              {
                credentials:
                  "include",
              },
            );

          if (
            statusResponse.ok
          ) {
            const status =
              await statusResponse.json();

            if (active) {
              setInitialized(
                Boolean(
                  status.initialized,
                ),
              );
            }
          }
        } catch {
          if (active) {
            setInitialized(true);
          }
        }

        if (active) {
          await refreshSession();
        }
      };

    initialize();

    return () => {
      active = false;
    };
  }, [refreshSession]);

  useEffect(() => {
    const handleUnauthorized =
      () => {
        setUser(null);
        setCsrfToken(null);
      };

    window.addEventListener(
      "auth:unauthorized",
      handleUnauthorized,
    );

    return () =>
      window.removeEventListener(
        "auth:unauthorized",
        handleUnauthorized,
      );
  }, []);

  const login =
    useCallback(
      async (
        input: LoginInput,
      ) => {
        const response =
          await fetch(
            "/api/auth/login",
            {
              method: "POST",

              credentials:
                "include",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  input,
                ),
            },
          );

        if (!response.ok) {
          throw new Error(
            await readApiError(
              response,
            ),
          );
        }

        const body =
          await response.json();

        setUser(body.user);

        setCsrfToken(
          body.csrfToken ||
            null,
        );

        setInitialized(true);
      },
      [],
    );

  const logout =
    useCallback(async () => {
      try {
        await apiFetch(
          "/api/auth/logout",
          {
            method: "POST",
          },
        );
      } finally {
        setUser(null);
        setCsrfToken(null);
      }
    }, []);

  const changePassword =
    useCallback(
      async (
        input:
          ChangePasswordInput,
      ) => {
        const response =
          await apiFetch(
            "/api/auth/change-password",
            {
              method: "POST",

              body:
                JSON.stringify(
                  input,
                ),
            },
          );

        if (!response.ok) {
          throw new Error(
            await readApiError(
              response,
            ),
          );
        }

        const body =
          await response.json();

        setUser(body.user);

        setCsrfToken(
          body.csrfToken ||
            null,
        );
      },
      [],
    );

  const hasPermission =
    useCallback(
      (
        permission: string,
      ) =>
        Boolean(
          user?.permissions.includes(
            permission,
          ),
        ),
      [user],
    );

  const value =
    useMemo<AuthContextValue>(
      () => ({
        user,
        loading,
        initialized,
        login,
        logout,
        changePassword,
        refreshSession,
        hasPermission,
      }),
      [
        user,
        loading,
        initialized,
        login,
        logout,
        changePassword,
        refreshSession,
        hasPermission,
      ],
    );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider.",
    );
  }

  return context;
}