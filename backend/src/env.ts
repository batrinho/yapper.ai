const REQUIRED = ["DATABASE_URL", "DEEPGRAM_API_KEY", "SESSION_SECRET"] as const;

type RequiredVar = (typeof REQUIRED)[number];

export function assertEnv() {
  const missing = REQUIRED.filter((name) => !process.env[name]);
  if (missing.length) {
    throw new Error(`Missing environment variable${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}. Add it to frontend/.env.local.`);
  }
}

export function env(name: RequiredVar): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}. Add it to frontend/.env.local.`);
  return value;
}
