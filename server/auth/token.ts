import {
  createHmac,
  timingSafeEqual,
} from "crypto";

import type {
  AppUserRecord,
  UserRole,
} from "./types.ts";

export const ACCESS_TOKEN_DURATION_MS =
  8 * 60 * 60 * 1000;

export const REMEMBERED_TOKEN_DURATION_MS =
  30 * 24 * 60 * 60 * 1000;

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  sessionVersion: number;
  issuedAt: number;
  expiresAt: number;
}

function getTokenSecret(): string {
  const configured = String(
    process.env.SESSION_SECRET ||
      "",
  ).trim();

  if (configured.length >= 32) {
    return configured;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET must contain at least 32 characters in production.",
    );
  }

  console.warn(
    "SESSION_SECRET is missing or too short. Using a development-only token secret.",
  );

  return "development-only-change-this-auth-token-secret-now";
}

function encodeJson(value: unknown): string {
  return Buffer.from(
    JSON.stringify(value),
    "utf8",
  ).toString("base64url");
}

function sign(value: string): string {
  return createHmac(
    "sha256",
    getTokenSecret(),
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

export function issueAuthToken(
  user: AppUserRecord,
  durationMs = ACCESS_TOKEN_DURATION_MS,
): {
  accessToken: string;
  expiresAt: string;
} {
  const now = Date.now();

  const payload: AuthTokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    sessionVersion:
      user.session_version,
    issuedAt: now,
    expiresAt: now + durationMs,
  };

  const header = encodeJson({
    alg: "HS256",
    typ: "JWT",
  });

  const body = encodeJson(payload);
  const unsigned = `${header}.${body}`;
  const signature = sign(unsigned);

  return {
    accessToken:
      `${unsigned}.${signature}`,
    expiresAt: new Date(
      payload.expiresAt,
    ).toISOString(),
  };
}

export function verifyAuthToken(
  token: string,
): AuthTokenPayload | null {
  try {
    const parts = token.split(".");

    if (parts.length !== 3) {
      return null;
    }

    const [header, body, signature] =
      parts;

    const unsigned = `${header}.${body}`;
    const expectedSignature =
      sign(unsigned);

    if (
      !signaturesMatch(
        expectedSignature,
        signature,
      )
    ) {
      return null;
    }

    const parsedHeader = JSON.parse(
      Buffer.from(
        header,
        "base64url",
      ).toString("utf8"),
    );

    if (
      parsedHeader?.alg !== "HS256" ||
      parsedHeader?.typ !== "JWT"
    ) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(
        body,
        "base64url",
      ).toString("utf8"),
    ) as AuthTokenPayload;

    if (
      !payload.userId ||
      !payload.email ||
      !Number.isFinite(
        payload.sessionVersion,
      ) ||
      !Number.isFinite(
        payload.expiresAt,
      ) ||
      payload.expiresAt <= Date.now()
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
