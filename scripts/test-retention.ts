// Verifies the 30-backup retention trim: calls createBackup(true) 33 times
// (ensureDailyBackup only fires once/day so this exercises createBackup
// directly, same function it calls) and confirms only the 30 most recent
// survive, both as DB rows and as files on disk.
import { createBackup, listBackups } from "../lib/services/backup";
import fs from "node:fs/promises";
import path from "node:path";

const BACKUP_DIR = path.resolve(process.cwd(), "backups");

async function main() {
  const before = await listBackups();
  console.log("Backup rows before:", before.length);

  for (let i = 0; i < 33; i++) {
    await createBackup(true);
    // ensure distinct timestamps (filename includes HHmmss)
    await new Promise((r) => setTimeout(r, 1100));
  }

  const after = await listBackups();
  const filesOnDisk = (await fs.readdir(BACKUP_DIR)).filter((f) => f.endsWith(".db"));
  console.log("Backup rows after 33 more creations:", after.length, "(expect 30)");
  console.log("Backup FILES on disk:", filesOnDisk.length, "(expect 30)");
  console.log("Newest row filePath:", after[0]?.filePath);
  console.log("Oldest surviving row filePath:", after[after.length - 1]?.filePath);

  // Cross-check every DB row has a matching file, and no orphan files exist.
  const rowFiles = new Set(after.map((b) => b.filePath));
  const diskFiles = new Set(filesOnDisk);
  const missingFiles = [...rowFiles].filter((f) => !diskFiles.has(f));
  const orphanFiles = [...diskFiles].filter((f) => !rowFiles.has(f));
  console.log("DB rows with no matching file:", missingFiles);
  console.log("Files on disk with no matching DB row:", orphanFiles);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
