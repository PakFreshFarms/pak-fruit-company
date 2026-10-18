// One-off: screenshot the app in Urdu by clicking the locale toggle, then
// navigating to a few key screens. Not part of the app — just for a demo.
import { chromium } from "playwright";

const CHROME_PATH = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const OUT_DIR = "/tmp/shots-ur";

async function shoot(page: import("playwright").Page, url: string, file: string, height = 1000) {
  await page.setViewportSize({ width: 1400, height });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT_DIR}/${file}`, fullPage: true });
}

async function main() {
  const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });

  // Land on dashboard, switch to Urdu via the topbar toggle (sets localStorage + dir=rtl).
  await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "اردو" }).click();
  await page.waitForTimeout(400);

  await shoot(page, "http://localhost:3000/dashboard", "1_dashboard.png");
  await shoot(page, "http://localhost:3000/bilti", "2_bilti_list.png");

  // Find the BL-102 bilti id via the list page link, then open its detail + patti.
  const biltiHref = await page.locator('a[href^="/bilti/"]').first().getAttribute("href");
  if (biltiHref) {
    await shoot(page, `http://localhost:3000${biltiHref}`, "3_bilti_detail.png", 1800);
  }

  await shoot(page, "http://localhost:3000/vendors", "4_vendors.png");
  const vendorHref = await page.locator('a[href^="/vendors/"]').first().getAttribute("href");
  if (vendorHref) {
    await shoot(page, `http://localhost:3000${vendorHref}`, "5_vendor_detail.png");
  }

  await shoot(page, "http://localhost:3000/accounts", "6_accounts.png");
  await shoot(page, "http://localhost:3000/reports", "7_reports.png");
  await shoot(page, "http://localhost:3000/settings", "8_settings.png");

  await browser.close();
  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
