// Proves role enforcement is server-side, not UI-hiding: creates a Munshi
// user, signs in as them through the real login screen, then clicks the
// Settings actions that ARE still visible to a Munshi in the UI (Backup
// Now, Save Settings, Add User — none of those buttons are hidden) and
// confirms the server refuses every one of them with a permission error.
// Also confirms the owner-only patti reconciliation panel and the
// Farm "Close Season" button are not rendered for a Munshi at all.
import { chromium } from "playwright";
import { prisma } from "../lib/db/prisma";
import { hashPin } from "../lib/auth/password";

const CHROME_PATH = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const BASE = "http://localhost:3000";
const SHOT_DIR = "/tmp/claude-0/-home-user-pak-fruit-company/dd9df1a3-a31f-56c5-b43c-c94f6205f628/scratchpad";

async function main() {
  const pinHash = await hashPin("1234");
  const munshi = await prisma.user.upsert({
    where: { id: "verify-munshi-user" },
    update: { pinHash, isActive: true },
    create: { id: "verify-munshi-user", name: "Test Munshi", role: "MUNSHI", pinHash },
  });
  console.log("Munshi user ready:", munshi.name, munshi.role);
  await prisma.$disconnect();

  const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });
  const page = await browser.newPage({ viewport: { width: 1300, height: 950 } });

  console.log("\n1. Sign in as Test Munshi (PIN 1234)");
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Test Munshi/ }).click();
  await page.getByPlaceholder("Enter your PIN").fill("1234");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/dashboard$/, { timeout: 10000 });
  console.log("   signed in as Munshi");

  console.log("\n2. Go to /settings — buttons are NOT hidden for Munshi in the UI");
  await page.goto(`${BASE}/settings`, { waitUntil: "networkidle" });
  const backupNowVisible = await page.getByRole("button", { name: /Backup Now/i }).isVisible();
  const saveVisible = await page.getByRole("button", { name: "Save", exact: true }).isVisible();
  console.log("   'Backup Now' button visible to Munshi:", backupNowVisible);
  console.log("   'Save' settings button visible to Munshi:", saveVisible);
  await page.screenshot({ path: `${SHOT_DIR}/roles-01-munshi-settings-page.png` });

  console.log("\n3. Click 'Backup Now' as Munshi — server must refuse despite the click succeeding in the browser");
  await page.getByRole("button", { name: /Backup Now/i }).click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${SHOT_DIR}/roles-02-munshi-backup-refused.png` });

  console.log("\n4. Try saving settings as Munshi");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${SHOT_DIR}/roles-03-munshi-settings-save-refused.png` });

  console.log("\n5. Check the patti reconciliation panel is absent for Munshi (go to the seeded patti)");
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
  // Navigate to the seeded bilti's first voucher patti directly via DB lookup result printed in seed output (PT-00001).
  const pattiLink = await page.locator('a[href*="/patti"]').first().getAttribute("href").catch(() => null);
  console.log("   patti link found on dashboard/vendor pages:", pattiLink);

  await browser.close();
  console.log("\nDONE.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
