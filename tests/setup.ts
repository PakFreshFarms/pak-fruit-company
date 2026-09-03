import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import path from "node:path";

const dbPath = path.resolve(__dirname, "../prisma/test.db");
process.env.DATABASE_URL = `file:${dbPath}`;

export function resetTestDatabase() {
  if (existsSync(dbPath)) unlinkSync(dbPath);
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    cwd: path.resolve(__dirname, ".."),
    env: { ...process.env, DATABASE_URL: `file:${dbPath}` },
    stdio: "pipe",
  });
}
