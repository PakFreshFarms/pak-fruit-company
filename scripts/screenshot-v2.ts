// Verifies: (1) Urdu reports page now fully translated, (2) the new colour
// theme picker works across a couple of accent choices, in both languages.
import { chromium } from "playwright";

const CHROME_PATH = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const OUT_DIR = "/tmp/shots-v2";

async function shoot(page: import("playwright").Page, file: string) {
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${OUT_DIR}/${file}`, fullPage: true });
}

async function main() {
  const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });

  await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "اردو" }).click();
  await page.waitForTimeout(300);
  await page.goto("http://localhost:3000/reports", { waitUntil: "networkidle" });
  await shoot(page, "1_reports_urdu_fixed.png");

  // Open the vendor ledger (Debit/Credit headers) in Urdu to confirm.
  await page.goto("http://localhost:3000/vendors", { waitUntil: "networkidle" });
  const vendorHref = await page.locator('a[href^="/vendors/"]').first().getAttribute("href");
  if (vendorHref) {
    await page.goto(`http://localhost:3000${vendorHref}`, { waitUntil: "networkidle" });
    await shoot(page, "2_vendor_ledger_urdu_fixed.png");
  }

  // Switch back to English and try the colour theme picker.
  await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "EN" }).click();
  await page.waitForTimeout(300);

  await page.getByRole("button", { name: "Theme" }).click();
  await page.waitForTimeout(200);
  await page.getByTitle("Green").click();
  await page.keyboard.press("Escape");
  await shoot(page, "3_theme_green.png");

  await page.getByRole("button", { name: "Theme" }).click();
  await page.waitForTimeout(200);
  await page.getByTitle("Blue").click();
  await page.keyboard.press("Escape");
  await shoot(page, "4_theme_blue.png");

  // Dark mode + purple accent together.
  await page.getByRole("button", { name: "Theme" }).click();
  await page.waitForTimeout(200);
  await page.getByText("Dark", { exact: true }).click();
  await page.waitForTimeout(200);
  await page.getByRole("button", { name: "Theme" }).click();
  await page.waitForTimeout(200);
  await page.getByTitle("Purple").click();
  await page.keyboard.press("Escape");
  await shoot(page, "5_theme_purple_dark.png");

  await browser.close();
  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
