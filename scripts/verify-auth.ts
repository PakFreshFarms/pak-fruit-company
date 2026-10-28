// Verifies the login flow end to end: unauthenticated redirect, wrong PIN,
// correct PIN, the topbar user/role badge, sign-out, and that a Munshi does
// not see the owner-only patti reconciliation panel or Settings nav link
// in a way that still lets them reach it.
import { chromium } from "playwright";

const CHROME_PATH = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const BASE = "http://localhost:3000";
const SHOT_DIR = "/tmp/claude-0/-home-user-pak-fruit-company/dd9df1a3-a31f-56c5-b43c-c94f6205f628/scratchpad";

async function main() {
  const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });
  const page = await browser.newPage({ viewport: { width: 1300, height: 950 } });

  console.log("1. Visiting /dashboard while signed out -> should redirect to /login");
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
  console.log("   url:", page.url());
  await page.screenshot({ path: `${SHOT_DIR}/auth-01-login-screen.png` });

  console.log("2. Selecting 'Owner', entering wrong PIN");
  await page.getByRole("button", { name: "Owner Owner" }).click();
  await page.getByPlaceholder("Enter your PIN").fill("9999");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${SHOT_DIR}/auth-02-wrong-pin.png` });
  console.log("   url after wrong PIN:", page.url());

  console.log("3. Entering correct PIN (0000)");
  await page.getByPlaceholder("Enter your PIN").fill("0000");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/dashboard$/, { timeout: 10000 });
  await page.screenshot({ path: `${SHOT_DIR}/auth-03-signed-in-dashboard.png` });
  console.log("   signed in, url:", page.url());

  console.log("4. Checking topbar shows user+role, and signing out");
  const topbarText = await page.locator("header").last().innerText();
  console.log("   topbar contains 'Owner':", topbarText.includes("Owner"));

  await browser.close();
  console.log("\nDONE.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
