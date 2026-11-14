import { defineConfig } from "drizzle-kit";
import { loadLocalEnv } from "./src/load-env";

loadLocalEnv();
if (!process.env.DATABASE_URL) throw new Error("Missing environment variable: DATABASE_URL. Add it to frontend/.env.local.");

export default defineConfig({
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL },
});
