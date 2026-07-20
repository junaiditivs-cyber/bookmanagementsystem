import "dotenv/config";
import { createInterface } from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { initializeAuthStore, createUserRecord, findUserByEmail } from "../server/auth/store.ts";
import { generateTemporaryPassword, hashPassword, validatePassword } from "../server/auth/password.ts";

const ALLOWED_EMAIL_DOMAIN = "mjkhan.com";
const ALLOWED_EMAIL_PATTERN = /^[^\s@]+@mjkhan\.com$/i;

function getArg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function promptHidden(label: string): Promise<string> {
  if (!input.isTTY || typeof input.setRawMode !== "function") {
    const fallback = createInterface({ input, output });
    return fallback.question(label).finally(() => fallback.close());
  }

  return new Promise((resolve, reject) => {
    let value = "";
    const wasRaw = input.isRaw;
    const cleanup = () => {
      input.off("data", onData);
      input.setRawMode(Boolean(wasRaw));
      input.pause();
    };
    const onData = (chunk: Buffer | string) => {
      const text = String(chunk);
      for (const character of text) {
        if (character === "\u0003") {
          cleanup();
          output.write("\n");
          reject(new Error("Administrator creation was cancelled."));
          return;
        }
        if (character === "\r" || character === "\n") {
          cleanup();
          output.write("\n");
          resolve(value);
          return;
        }
        if (character === "\u007f" || character === "\b") {
          if (value.length > 0) {
            value = value.slice(0, -1);
            output.write("\b \b");
          }
          continue;
        }
        if (character >= " " && character !== "\u007f") {
          value += character;
          output.write("*");
        }
      }
    };

    output.write(label);
    input.setEncoding("utf8");
    input.setRawMode(true);
    input.resume();
    input.on("data", onData);
  });
}

async function main() {
  await initializeAuthStore();
  const rl = createInterface({ input, output });

  try {
    const name = String(
      getArg("name") || process.env.INITIAL_ADMIN_NAME || (await rl.question("Administrator name: ")),
    ).trim();
    const email = String(
      getArg("email") || process.env.INITIAL_ADMIN_EMAIL || (await rl.question("Administrator email: ")),
    ).trim().toLowerCase();

    if (!name || !email) throw new Error("Name and email are required.");
    if (!ALLOWED_EMAIL_PATTERN.test(email)) {
      throw new Error(`Only @${ALLOWED_EMAIL_DOMAIN} email addresses are allowed.`);
    }
    if (await findUserByEmail(email)) throw new Error("A user with this email already exists.");

    let password = String(getArg("password") || process.env.INITIAL_ADMIN_PASSWORD || "");
    let generated = false;
    if (!password) {
      rl.close();
      const entered = await promptHidden(
        "Password (leave blank to generate a secure temporary password): ",
      );
      password = entered.trim();
    }
    if (!password) {
      password = generateTemporaryPassword(18);
      generated = true;
    }

    const validation = validatePassword(password, { name, email });
    if (!validation.valid) {
      throw new Error(validation.errors.join("\n"));
    }

    const now = new Date().toISOString();
    const user = await createUserRecord({
      name,
      email,
      password_hash: await hashPassword(password),
      password_history: [],
      role: "super_admin",
      status: "active",
      must_change_password: true,
      failed_login_attempts: 0,
      locked_until: null,
      session_version: 1,
      last_login_at: null,
      password_changed_at: now,
      created_by: "bootstrap",
      updated_by: "bootstrap",
    });

    console.log("\nSuper administrator created successfully.");
    console.log(`Name: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Temporary password: ${password}`);
    console.log(
      generated
        ? "Store this password securely. It will not be shown again."
        : "The administrator will be required to change this password at first sign-in.",
    );
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error(`\nUnable to create administrator:\n${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});