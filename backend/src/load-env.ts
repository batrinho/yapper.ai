import { existsSync } from "node:fs";
import { resolve } from "node:path";

/** Scripts outside Next.js (drizzle-kit, the seed) run from backend/ and read the app's frontend/.env.local. */
export function loadLocalEnv() {
  const file = resolve("../frontend/.env.local");
  if (existsSync(file)) process.loadEnvFile(file);
}
