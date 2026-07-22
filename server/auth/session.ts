import {
  createHmac,
  timingSafeEqual,
} from "crypto";

import type {
  NextFunction,
  Request,
  Response,
} from "express";

const COOKIE_NAME = "ivs.books.sid";

const EIGHT_HOURS_MS =
  8 * 60 * 60 * 1000;

export const SESSION_DURATION_MS =
  EIGHT_HOURS_MS;

export const REMEMBER_ME_DURATION_MS =
  30 * 24 * 60 * 60 * 1000;

interface StoredSessionPayload {
  auth?: {
    userId: string;
    email: string;
    role: string;
    sessionVersion: number;
  };

  csrfToken?: string;
  expiresAt: number;
}

function getSessionSecret(): string {
  const configured = String(
    process.env.SESSION_SECRET || "",
  ).trim();

  if (configured.length >= 32) {
    return configured;
  }

  if (
    process.env.NODE_ENV ===
    "production"
  ) {
    throw new Error(
      "SESSION_SECRET must contain at least 32 characters in production.",
    );
  }

  console.warn(
    "SESSION_SECRET is missing or too short. A development-only secret is being used.",
  );

  return "development-only-change-this-session-secret-please";
}

function readCookie(
  req: Request,
  name: string,
): string | null {
  const header = String(
    req.headers.cookie || "",
  );

  for (const part of header.split(";")) {
    const separator =
      part.indexOf("=");

    if (separator < 0) {
      continue;
    }

    const key =
      part.slice(0, separator).trim();

    if (key !== name) {
      continue;
    }

    try {
      return decodeURIComponent(
        part.slice(separator + 1),
      );
    } catch {
      return null;
    }
  }

  return null;
}

function signValue(
  value: string,
  secret: string,
): string {
  return createHmac(
    "sha256",
    secret,
  )
    .update(value)
    .digest("base64url");
}

function signaturesMatch(
  expected: string,
  received: string,
): boolean {
  try {
    const expectedBuffer =
      Buffer.from(expected);

    const receivedBuffer =
      Buffer.from(received);

    return (
      expectedBuffer.length ===
        receivedBuffer.length &&
      timingSafeEqual(
        expectedBuffer,
        receivedBuffer,
      )
    );
  } catch {
    return false;
  }
}

function encodeSession(
  payload: StoredSessionPayload,
  secret: string,
): string {
  const body = Buffer.from(
    JSON.stringify(payload),
    "utf8",
  ).toString("base64url");

  return `${body}.${signValue(
    body,
    secret,
  )}`;
}

function decodeSession(
  token: string | null,
  secret: string,
): StoredSessionPayload | null {
  if (!token) {
    return null;
  }

  const separator =
    token.lastIndexOf(".");

  if (separator < 1) {
    return null;
  }

  const body =
    token.slice(0, separator);

  const receivedSignature =
    token.slice(separator + 1);

  const expectedSignature =
    signValue(body, secret);

  if (
    !signaturesMatch(
      expectedSignature,
      receivedSignature,
    )
  ) {
    return null;
  }

  try {
    const payload =
      JSON.parse(
        Buffer.from(
          body,
          "base64url",
        ).toString("utf8"),
      ) as StoredSessionPayload;

    if (
      !Number.isFinite(
        payload.expiresAt,
      ) ||
      payload.expiresAt <=
        Date.now()
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function clearSessionCookie(
  res: Response,
): void {
  res.clearCookie(
    COOKIE_NAME,
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      path: "/",
    },
  );
}

export function createSessionMiddleware() {
  const secret =
    getSessionSecret();

  return (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const incomingToken =
      readCookie(
        req,
        COOKIE_NAME,
      );

    const stored =
      decodeSession(
        incomingToken,
        secret,
      );

    let destroyed = false;

    const defaultMaxAge =
      stored
        ? Math.max(
            1,
            stored.expiresAt -
              Date.now(),
          )
        : SESSION_DURATION_MS;

    const sessionObject: any = {
      auth: stored?.auth,
      csrfToken:
        stored?.csrfToken,

      cookie: {
        maxAge:
          defaultMaxAge,
      },

      regenerate(
        callback: (
          error?: unknown,
        ) => void,
      ) {
        this.auth =
          undefined;

        this.csrfToken =
          undefined;

        this.cookie.maxAge =
          SESSION_DURATION_MS;

        destroyed = false;

        callback();
      },

      save(
        callback: (
          error?: unknown,
        ) => void,
      ) {
        try {
          if (destroyed) {
            clearSessionCookie(
              res,
            );

            callback();
            return;
          }

          const requestedMaxAge =
            Number(
              this.cookie
                ?.maxAge,
            );

          const maxAge =
            Number.isFinite(
              requestedMaxAge,
            ) &&
            requestedMaxAge > 0
              ? requestedMaxAge
              : SESSION_DURATION_MS;

          const token =
            encodeSession(
              {
                auth:
                  this.auth,
                csrfToken:
                  this.csrfToken,
                expiresAt:
                  Date.now() +
                  maxAge,
              },
              secret,
            );

          res.cookie(
            COOKIE_NAME,
            token,
            {
              httpOnly: true,
              secure:
                process.env
                  .NODE_ENV ===
                "production",
              sameSite:
                "lax",
              maxAge,
              path: "/",
            },
          );

          callback();
        } catch (error) {
          callback(error);
        }
      },

      destroy(
        callback: (
          error?: unknown,
        ) => void,
      ) {
        destroyed = true;

        this.auth =
          undefined;

        this.csrfToken =
          undefined;

        clearSessionCookie(
          res,
        );

        callback();
      },

      reload(
        callback: (
          error?: unknown,
        ) => void,
      ) {
        callback();
      },

      touch() {
        return this;
      },
    };

    (req as any).session =
      sessionObject;

    (req as any).sessionID =
      "stateless-cookie-session";

    if (
      incomingToken &&
      !stored
    ) {
      clearSessionCookie(
        res,
      );
    }

    next();
  };
}
