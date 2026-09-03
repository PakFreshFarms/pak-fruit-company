import { prisma } from "@/lib/db/prisma";
import fs from "node:fs/promises";
import path from "node:path";
import { format } from "date-fns";

const DB_PATH = path.resolve(process.cwd(), "prisma", "dev.db");
const BACKUP_DIR = path.resolve(process.cwd(), "backups");

async function ensureBackupDir() {
  await fs.mkdir(BACKUP_DIR, { recursive: true });
}

export async function createBackup(auto = false) {
  await ensureBackupDir();
  const stamp = format(new Date(), "yyyy-MM-dd_HHmmss");
  const filename = `mandi-hisab_${stamp}${auto ? "_auto" : ""}.db`;
  const filePath = path.join(BACKUP_DIR, filename);
  await fs.copyFile(DB_PATH, filePath);
  const stat = await fs.stat(filePath);

  await prisma.backup.create({ data: { filePath: filename, sizeBytes: stat.size, auto } });

  // Keep only the most recent 30 backups (spec section 7.12).
  const all = await prisma.backup.findMany({ orderBy: { createdAt: "desc" } });
  const toDelete = all.slice(30);
  for (const b of toDelete) {
    await fs.unlink(path.join(BACKUP_DIR, b.filePath)).catch(() => {});
    await prisma.backup.delete({ where: { id: b.id } });
  }

  return filename;
}

export async function listBackups() {
  return prisma.backup.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getBackupFilePath(filename: string) {
  const resolved = path.join(BACKUP_DIR, filename);
  if (!resolved.startsWith(BACKUP_DIR)) throw new Error("Invalid backup file");
  return resolved;
}

/** Ensures one automatic backup has been made today — called on the app's first server-rendered page load of the day. */
export async function ensureDailyBackup() {
  const latestAuto = await prisma.backup.findFirst({ where: { auto: true }, orderBy: { createdAt: "desc" } });
  const today = format(new Date(), "yyyy-MM-dd");
  if (latestAuto && format(latestAuto.createdAt, "yyyy-MM-dd") === today) return;
  await createBackup(true).catch((e) => console.error("Automatic backup failed:", e));
}

export async function restoreFromBuffer(buffer: Buffer) {
  // Safety copy of the current database before overwriting it.
  await createBackup(false);
  await fs.writeFile(DB_PATH, buffer);
}
