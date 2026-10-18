// Walkthrough: one full voucher from scratch (new vendor, new lot, two sales —
// one to an existing customer, one to a brand-new customer created inline).
// Setup dialogs (bilti/truck/lot — done once per truck, not a repeated daily
// action) are filled by field for reliability. The sale-entry row — the
// screen a munshi uses for hours — is driven strictly by Tab/Enter/typing
// after one initial click, with every action logged.

import { chromium, type Page } from "playwright";

const CHROME_PATH = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const OUT_DIR = "/tmp/walkthrough";
const BASE = "http://localhost:3000";

const actions: string[] = [];
let shotIndex = 0;

function log(action: string) {
  actions.push(action);
  console.log(`[${actions.length}] ${action}`);
}

async function shot(page: Page, label: string) {
  shotIndex += 1;
  const file = `${String(shotIndex).padStart(2, "0")}_${label}.png`;
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${OUT_DIR}/${file}` });
  console.log(`  -> screenshot: ${file}`);
}

async function main() {
  const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });
  const page = await browser.newPage({ viewport: { width: 1300, height: 950 } });

  // ================= SETUP (once per truck — click + fill) =================
  await page.goto(`${BASE}/bilti`, { waitUntil: "networkidle" });
  log("CLICK  'New Bilti'");
  await page.getByRole("button", { name: "New Bilti" }).click();
  await shot(page, "new-bilti-dialog");
  log("FILL   Bilti No, Truck No, Item, Total Crates");
  await page.getByLabel("Bilti No").fill("BL-103");
  await page.getByLabel("Truck No").fill("ABC-999");
  await page.getByLabel("Item").fill("Mango");
  await page.getByLabel("Total Crates").fill("400");
  log("CLICK  'Save'");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.waitForURL(/\/bilti\/[a-z0-9]+$/, { timeout: 10000 });
  await shot(page, "bilti-created");

  log("CLICK  'Add Voucher'");
  await page.getByRole("button", { name: "Add Voucher" }).click();
  await shot(page, "add-voucher-dialog");
  await page.getByLabel("Voucher No").fill("1");
  log("CLICK  vendor combobox, TYPE 'Rashid' (new vendor, no match)");
  await page.locator("button", { hasText: "Select vendor" }).click();
  await page.keyboard.type("Rashid");
  await shot(page, "vendor-inline-create-option");
  log('KEY    Enter (select "+ Add Rashid" — creates and selects the vendor)');
  await page.keyboard.press("Enter");
  await page.waitForTimeout(400);
  await shot(page, "vendor-created-selected");
  await page.getByLabel("Crates", { exact: true }).fill("400");
  log("CLICK  'Save'");
  await page.getByRole("dialog").getByRole("button", { name: "Save", exact: true }).click();
  await page.waitForTimeout(500);
  await shot(page, "voucher-created");

  log("CLICK  'Add Lot'");
  await page.getByRole("button", { name: "Add Lot" }).click();
  await shot(page, "add-lot-dialog");
  await page.getByLabel("Lot Name").fill("Mango Premium");
  await page.getByLabel("Crates", { exact: true }).fill("400");
  await page.getByLabel("Report Rate").fill("700");
  log("CLICK  'Save'");
  await page.getByRole("dialog").getByRole("button", { name: "Save", exact: true }).click();
  await page.waitForTimeout(500);
  await shot(page, "lot-created-quick-entry-visible");

  // ========= SALE ENTRY — the screen the munshi lives in all day =========
  // From here on: exactly one click to enter the row, then Tab / Enter / typing only.
  const entryRow = page.getByText("Quick Sale Entry").locator("..");

  log("CLICK  Lot field (the ONE click to start — everything after is keyboard)");
  await entryRow.getByRole("combobox").first().click();
  await page.waitForTimeout(150);
  log("KEY    Enter (confirm the only lot — Mango Premium)");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(200);

  log("KEY    Tab  (Lot -> Customer)");
  await page.keyboard.press("Tab");
  await page.waitForTimeout(150);
  log("KEY    Enter (open Customer combobox)");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(150);
  log("TYPE   'Bilal' (existing customer)");
  await page.keyboard.type("Bilal", { delay: 40 });
  await page.waitForTimeout(200);
  await shot(page, "customer-search-existing");
  log("KEY    Enter (select Bilal Traders)");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(200);

  log("KEY    Tab  (Customer -> Crates)");
  await page.keyboard.press("Tab");
  await page.waitForTimeout(150);
  log("TYPE   '150'");
  await page.keyboard.type("150", { delay: 40 });
  log("KEY    Tab  (Crates -> Rate)");
  await page.keyboard.press("Tab");
  await page.waitForTimeout(150);
  log("TYPE   '720'");
  await page.keyboard.type("720", { delay: 40 });
  await shot(page, "live-preview-before-save-1");
  log("KEY    Enter (save sale 1 — row clears, focus returns to Customer)");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(800);
  await shot(page, "sale-1-saved-focus-on-customer");

  log("KEY    Enter (open Customer combobox — already focused, no click)");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(150);
  log("TYPE   'Noor Traders' (brand-new customer)");
  await page.keyboard.type("Noor Traders", { delay: 40 });
  await page.waitForTimeout(200);
  await shot(page, "customer-inline-create-option");
  log('KEY    Enter (select "+ Add Noor Traders" — creates and selects)');
  await page.keyboard.press("Enter");
  await page.waitForTimeout(600);

  log("KEY    Tab  (Customer -> Crates)");
  await page.keyboard.press("Tab");
  await page.waitForTimeout(150);
  log("TYPE   '250'");
  await page.keyboard.type("250", { delay: 40 });
  log("KEY    Tab  (Crates -> Rate)");
  await page.keyboard.press("Tab");
  await page.waitForTimeout(150);
  log("TYPE   '680'");
  await page.keyboard.type("680", { delay: 40 });
  await shot(page, "live-preview-before-save-2");
  log("KEY    Enter (save sale 2 — lot now fully sold, 400/400)");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(800);
  await shot(page, "voucher-fully-sold");

  log("CLICK  'Generate Patti'");
  await page.getByRole("button", { name: "Generate Patti" }).click();
  await page.waitForURL(/\/patti$/, { timeout: 10000 });
  await shot(page, "patti-generated");

  await browser.close();

  console.log("\n--- ACTION LOG SUMMARY ---");
  const startIdx = actions.findIndex((a) => a.includes("ONE click to start"));
  const endIdx = actions.findIndex((a) => a.includes("Generate Patti"));
  const setupClicks = actions.slice(0, startIdx).filter((a) => a.startsWith("CLICK")).length;
  const saleEntryActions = actions.slice(startIdx, endIdx);
  const saleClicks = saleEntryActions.filter((a) => a.startsWith("CLICK")).length;
  const saleKeys = saleEntryActions.filter((a) => a.startsWith("KEY")).length;
  const saleTypes = saleEntryActions.filter((a) => a.startsWith("TYPE")).length;
  console.log(`Setup (bilti + voucher + lot, one-time per truck): ${setupClicks} clicks total`);
  console.log(
    `Sale entry for 2 full sales (1 existing + 1 brand-new customer): ${saleClicks} click, ${saleKeys} key presses, ${saleTypes} typed fields — zero additional mouse use after the first click`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
