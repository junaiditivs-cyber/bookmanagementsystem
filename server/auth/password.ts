import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "crypto";

const KEY_LENGTH = 64;
const SCRYPT_COST = 16384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;

export const SIMPLE_PASSWORD_MIN_LENGTH = 6;
export const SIMPLE_PASSWORD_MAX_LENGTH = 128;

function deriveKey(
  password: string,
  salt: Buffer,
  keyLength: number,
  options: { N: number; r: number; p: number; maxmem: number },
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey as Buffer);
    });
  });
}

export interface PasswordValidationContext {
  name?: string;
  email?: string;
}

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePassword(
  password: string,
  _context: PasswordValidationContext = {},
): PasswordValidationResult {
  const errors: string[] = [];
  const normalized = String(password || "");

  if (normalized.length < SIMPLE_PASSWORD_MIN_LENGTH) {
    errors.push(
      `Password must contain at least ${SIMPLE_PASSWORD_MIN_LENGTH} characters.`,
    );
  }

  if (normalized.length > SIMPLE_PASSWORD_MAX_LENGTH) {
    errors.push(
      `Password must not exceed ${SIMPLE_PASSWORD_MAX_LENGTH} characters.`,
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = await deriveKey(password, salt, KEY_LENGTH, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK_SIZE,
    p: SCRYPT_PARALLELIZATION,
    maxmem: 64 * 1024 * 1024,
  });

  return [
    "scrypt",
    String(SCRYPT_COST),
    String(SCRYPT_BLOCK_SIZE),
    String(SCRYPT_PARALLELIZATION),
    salt.toString("base64"),
    derivedKey.toString("base64"),
  ].join("$");
}

export async function verifyPassword(
  password: string,
  encodedHash: string,
): Promise<boolean> {
  try {
    const [algorithm, cost, blockSize, parallelization, saltBase64, hashBase64] =
      encodedHash.split("$");

    if (algorithm !== "scrypt" || !saltBase64 || !hashBase64) {
      return false;
    }

    const expectedHash = Buffer.from(hashBase64, "base64");
    const actualHash = await deriveKey(
      password,
      Buffer.from(saltBase64, "base64"),
      expectedHash.length,
      {
        N: Number(cost),
        r: Number(blockSize),
        p: Number(parallelization),
        maxmem: 64 * 1024 * 1024,
      },
    );

    return (
      expectedHash.length === actualHash.length &&
      timingSafeEqual(expectedHash, actualHash)
    );
  } catch {
    return false;
  }
}

export function generateTemporaryPassword(length = 10): string {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const targetLength = Math.max(8, length);

  return Array.from({ length: targetLength }, () => {
    return alphabet[randomBytes(1)[0] % alphabet.length];
  }).join("");
}