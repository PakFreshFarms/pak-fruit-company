import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import path from "node:path";

/**
 * Each test file gets its own SQLite file (name defaults to "test") rather
 * than sharing prisma/test.db — Vitest runs test files in parallel worker
 * processes by default, and two files both unlinking + prisma-db-push'ing
 * the same file at the same time race each other (one file's reset can wipe
 * rows mid-seed for another file running concurrently, surfacing as a
 * spurious "Unique constraint failed").
 */
export function resetTestDatabase(name = "test") {
  const dbPath = path.resolve(__dirname, `../prisma/${name}.db`);
  if (existsSync(dbPath)) unlinkSync(dbPath);
  process.env.DATABASE_URL = `file:${dbPath}`;
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    cwd: path.resolve(__dirname, ".."),
    env: { ...process.env, DATABASE_URL: `file:${dbPath}` },
    stdio: "pipe",
  });
}
