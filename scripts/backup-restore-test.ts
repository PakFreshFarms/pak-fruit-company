// Destructive backup/restore test, driven through the real Settings UI
// (not by calling backup.ts functions directly) so the actual user-facing
// path is what gets exercised: click "Backup Now" -> file + DB row appear ->
// download that exact backup -> delete the live database entirely ->
// observe whether the app survives -> restore via the Settings upload form
// -> confirm data is back.

import { chromium } from "playwright";
import fs from "node:fs";
import crypto from "node:crypto";

const CHROME_PATH = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const BASE = "http://localhost:3000";
const DL_PATH = "/tmp/claude-0/-home-user-pak-fruit-company/dd9df1a3-a31f-56c5-b43c-c94f6205f628/scratchpad/manual-backup-downloaded.db";
const SHOT_DIR = "/tmp/claude-0/-home-user-pak-fruit-company/dd9df1a3-a31f-56c5-b43c-c94f6205f628/scratchpad";

function sha256(path: string) {
  return crypto.createHash("sha256").update(fs.readFileSync(path)).digest("hex");
}

async function main() {
  const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });
  const page = await browser.newPage({ viewport: { width: 1300, height: 950 } });

  console.log("STEP 1: open /settings, click Backup Now");
  await page.goto(`${BASE}/settings`, { waitUntil: "networkidle" });
  const rowsBefore = await page.locator("table.ledger-table").nth(0).locator("tbody tr").count().catch(() => 0);
  // the backup table is the 3rd ledger-table on the page (settings form has none, users table is one)
  const backupTableBefore = await page.getByRole("button", { name: /Backup Now/i }).isVisible();
  console.log("  Backup Now button visible:", backupTableBefore);

  await page.getByRole("button", { name: /Backup Now/i }).click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${SHOT_DIR}/01_after_backup_now.png` });
  await page.reload({ waitUntil: "networkidle" });

  // find the newest (manual) backup row's download link
  const downloadLinks = page.locator('a[href^="/api/backup/"]');
  const linkCount = await downloadLinks.count();
  console.log("  backup rows now visible in table:", linkCount);
  const firstHref = await downloadLinks.first().getAttribute("href");
  console.log("  newest backup download href:", firstHref);

  console.log("STEP 2: download that exact backup file via the real download link");
  const [download] = await Promise.all([page.waitForEvent("download"), downloadLinks.first().click()]);
  await download.saveAs(DL_PATH);
  console.log("  saved to:", DL_PATH, "size:", fs.statSync(DL_PATH).size, "bytes");
  console.log("  sha256:", sha256(DL_PATH));

  await browser.close();
  console.log("\nSTEP 1-2 COMPLETE. Backup triggered via real UI and downloaded via real download link.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
