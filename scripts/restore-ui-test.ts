// Tests the real in-app "Restore" button end to end:
// 1. Add a new user via the Settings UI (a clear, visible marker).
// 2. Confirm it's there.
// 3. Use the real Restore button + file upload to roll back to the earlier
//    known-good backup (the manual one downloaded in step 2 of
//    backup-restore-test.ts, which does NOT contain this new user).
// 4. Confirm (after the required restart) that the marker user is gone and
//    everything else matches that backup's known state exactly.

import { chromium } from "playwright";

const CHROME_PATH = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const BASE = "http://localhost:3000";
const SHOT_DIR = "/tmp/claude-0/-home-user-pak-fruit-company/dd9df1a3-a31f-56c5-b43c-c94f6205f628/scratchpad";
const BACKUP_FILE = `${SHOT_DIR}/manual-backup-downloaded.db`;

async function main() {
  const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });
  const page = await browser.newPage({ viewport: { width: 1300, height: 950 } });

  console.log("STEP A: add a marker user 'ZZ_RESTORE_TEST_USER' via the real Settings UI");
  await page.goto(`${BASE}/settings`, { waitUntil: "networkidle" });
  await page.getByPlaceholder("Name").fill("ZZ_RESTORE_TEST_USER");
  await page.getByPlaceholder("PIN").fill("9999");
  await page.locator("button:has(svg.lucide-user-plus)").click();
  await page.waitForTimeout(800);
  await page.reload({ waitUntil: "networkidle" });
  const hasMarker = await page.getByText("ZZ_RESTORE_TEST_USER").isVisible();
  console.log("  marker user visible after add:", hasMarker);
  await page.screenshot({ path: `${SHOT_DIR}/02_marker_user_added.png` });

  console.log("STEP B: click Restore, upload the earlier backup (taken before the marker user existed), confirm");
  await page.getByRole("button", { name: /Restore/i, exact: true }).click();
  await page.waitForTimeout(300);
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(BACKUP_FILE);
  await page.screenshot({ path: `${SHOT_DIR}/03_restore_dialog_file_selected.png` });
  await page.getByRole("button", { name: /Confirm/i }).click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SHOT_DIR}/04_after_restore_toast.png` });

  await browser.close();
  console.log("\nSTEP A-B COMPLETE.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
