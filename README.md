# Mandi Hisab — منڈی حساب

Accounting software for a fruit market commission agent (arhti) with own farm operations. Built with Next.js 15 (App Router), TypeScript, Prisma + SQLite, Tailwind CSS, and react-hook-form + Zod. Runs fully offline against a local database file.

## The one rule that shapes everything

Consignment sales are **never** the arhti's revenue. When a truck sells for Rs 1,000,000, the shop's income is only the ~10% commission — the rest is money held for the vendor and sits as a liability until paid out. Every posting in this codebase (see `lib/journal`, `lib/services`) follows that rule: gross sale amounts move between the customer and the vendor, and only commission + expense recovery ever touch an income account.

## Quick start

```bash
npm install
cp .env.example .env
npm run db:push      # creates prisma/dev.db from the schema
npm run seed          # seeds the chart of accounts + a sample bilti (BL-101)
npm run dev            # http://localhost:3000
```

For daily use once installed:

```bash
npm run build && npm start
```

Run the accounting-engine test suite (this is what proves the dual-rate/commission math in section 6 of the spec is implemented exactly):

```bash
npm test
```

## Bilingual interface (English / Urdu toggle)

Beyond the spec's baseline requirement of showing the client's own vocabulary bilingually (see the "کرایہ / Kiraya" style labels throughout), the whole interface can be switched between English and Urdu from the **EN / اردو** toggle in the top bar. This is a full language switch, not just secondary labels:

- Every screen — navigation, buttons, forms, table headers, reports, the patti, dashboard — is sourced from a translation dictionary (`lib/i18n/dictionaries/en.json` and `ur.json`) through a `useTranslation()` hook, so switching languages re-labels the entire app, not just isolated strings.
- The choice is remembered per browser (`localStorage`) and applied on load — including `dir="rtl"` and the Noto Nastaliq Urdu font when Urdu is active.
- Separately, and always regardless of the toggle, the client's own trade vocabulary (Kiraya, Mazdoori, Munshiyana, Patti, Wasooli, etc.) is shown bilingually side-by-side via the `<Vocab>` component, per the original spec's "English primary, Urdu secondary" requirement — this satisfies both what was originally specified and the newer ask that *everything* be usable in both languages.
- Extending the dictionary: add the same key to both `en.json` and `ur.json`; a missing Urdu key falls back to English rather than breaking.

## Architecture

- **`prisma/schema.prisma`** — the full data model from the spec (Account, JournalEntry/JournalLine, Bilti, BiltiExpense, Voucher, Lot, Sale, Farm/FarmExpense/FarmDispatch, CashEntry, User, Setting).
- **`lib/money`** — `toPaisa`, `formatPKR`, `amountInWords`, `splitTruckTotal`. Every amount in the database and every calculation is an integer number of paisa; nothing in this codebase uses floating point for money.
- **`lib/journal`** — `postJournal` is the *only* way anything writes to the ledger. It asserts debits equal credits and rejects unbalanced or malformed entries. `reverseJournal` creates a reversing entry rather than editing or deleting a posted one.
- **`lib/accounting/calculations.ts`** — pure, unit-tested functions implementing rules 6.2, 6.5, and 6.6 (dual-rate sale math, the bilti-wide expense split with remainder reconciliation, and patti totals). These have no I/O, so `tests/worked-example.test.ts` exercises them directly against the spec's section 6.7 worked example and asserts the exact figures given (33,000 total expenses, 300,000 gross, 30,000 commission, 237,000 net payable, etc.), then re-derives the same numbers end-to-end through the real database and journal service.
- **`lib/services/*`** — the layer that actually mutates the database: `sales.ts` posts the dual-rate journal entry per sale, `patti.ts` computes and posts commission + expense recovery and generates the patti, `bilti.ts` creates biltis/vouchers/lots without posting anything (consignment stock isn't owned), `cash.ts` powers both the Cash Book and Wasooli books through one shared posting function, `farm.ts` handles farm expenses/dispatches as their own cost centre via `JournalLine.farmId`.
- **`app/actions/*`** — Next.js Server Actions used by the client forms; each wraps a service call with Zod validation and `revalidatePath`.
- **`app/(app)/*`** — the screens, one route per spec section 7 (dashboard, bilti, vendors, customers, cash-book, wasooli, farms, accounts, reports, settings), sharing one sidebar/topbar shell in `components/layout`.

## Verified against the spec's worked example

`npm test` runs both a pure-calculation suite and a full database round-trip (create accounts → bilti BL-101 → vouchers 23/24 → lots → sales → generate patti) and asserts:

- The exact sale journal `Dr Hayyan Ali 33,000 / Cr Ahmed 36,000 / Dr Rate Difference 3,000` from section 6.7.
- Every journal entry in the system balances (`Σdebit = Σcredit`).
- Voucher 23's gross report (300,000), commission (30,000), expenses (33,000), and net payable (237,000) match the spec exactly.
- Ahmed's own ledger never contains a Rate Difference line — that account is separate income, tagged to the vendor for reporting only (`getVendorRateDifferencePosition`), and is excluded from every vendor balance/ledger view.

`npm run seed` reproduces this same scenario in the running app so it's visible on first launch, and additionally leaves vendor Shazia's voucher 24 open (700 crates, unsold) so the dashboard's "vouchers awaiting patti" list has something to show.

## Assumptions made while building (per the brief's "use the stated default and note it" instruction)

- **Farm postings need their own accounts.** The spec's system chart of accounts (4.1) doesn't name an account for farm cost-centre postings. Two were added — `Farm Expenses` and `Farm Sales Income` — so farm activity is real double-entry (tagged per-farm via `JournalLine.farmId`) rather than mixing into the unrelated `Shop Expenses` head.
- **Patti footer figures.** "Previous balance" is the vendor's ledger balance excluding this voucher's own contribution (`closingBalance + netPayable`, algebraically consistent with the ledger); "advance adjusted" sums debit lines on the vendor's ledger whose narration contains "advance" up to the patti date, since the data model doesn't otherwise tag a CashEntry as specifically an advance versus any other vendor payment.
- **Cash Book day sheet** shows every journal line that actually touched *Cash in Hand* that day — cash-book entries, wasooli recoveries, and farm cash movements alike — so the opening/closing balances shown always reconcile exactly, rather than only showing entries created from that specific screen.
- **Role permissions are modeled but not enforced end-to-end.** The `User` table (Owner/Munshi + PIN) exists per spec 4.9 and the rate card locks itself once any voucher on a bilti has a patti, but there's no login/session flow gating the UI by role in this pass — every write uses a fixed `createdBy: "owner"`. Worth adding before handing this to a Munshi who shouldn't have Owner-level access.
- **Customer ageing** is computed with a FIFO allocation (oldest sale debits consumed first by wasooli credits) rather than a single running balance, so the 0–7/8–15/16–30/30+ buckets reflect genuinely unpaid invoices.
- **Kiraya override** only applies when that head's basis is `PER_CRATE` or `FIXED_PER_VOUCHER`; if the owner switches Kiraya itself to `TRUCK_TOTAL_SPLIT` via the rate-card dropdown, the truck-total split ignores any per-voucher override (the two concepts — a per-crate override and a whole-truck amount — aren't reconcilable).
- **Backups.** "A chosen folder" was implemented as a `backups/` directory inside the project (kept out of git) with a browser download link per backup, since a web app has no native folder picker; automatic daily backup is triggered on the first server-rendered page load of each day and keeps the most recent 30. Destructive-test findings (backup created and downloaded via the real Settings UI, database then deleted entirely, restored, and verified against a full pre-destruction snapshot of all 16 tables — exact match, see PR description for details): (1) if `prisma/dev.db` is deleted outright (not just reverted), every page — Settings included — 500s, because every page is a Server Component that queries the database to render; the in-app Restore button is then unreachable, and recovery requires copying a downloaded backup file over `prisma/dev.db` directly on disk, then restarting the app. The in-app Restore flow itself works correctly and was verified end-to-end whenever the database file is still present and queryable (e.g. reverting to an earlier backup on purpose). (2) Restoring reverts the `Backup` table itself to the restored snapshot's point in time, so any backup files created after that point — including the safety copy `restoreFromBuffer` takes of the pre-restore state — become orphaned files on disk: still present, but untracked, invisible in the Settings backup list, and never cleaned up by the 30-file retention trim (which only operates on DB-tracked rows). Harmless but accumulates disk usage over repeated restores; worth a startup reconciliation pass if this matters in production.
- **Electron wrapper** (`desktop/`) is provided as specified but is unit-untested in this environment (no GUI/display available here) — see below.

## Desktop app (optional)

`desktop/` is a small Electron wrapper: on launch it spawns `npm start` in the project root, waits for the server to answer, then opens it in a native window (menu bar hidden). To build a Windows installer with a desktop shortcut:

```bash
cd desktop
npm install
npm run dist        # produces an NSIS installer via electron-builder
```

This has not been runtime-tested (no desktop environment in the build sandbox) — sanity-check `npm run start` inside `desktop/` on a Windows machine with the main project already built before shipping.

## Daily routine (quick reference / روزانہ کا طریقہ کار)

1. **صبح — Morning:** Open the app (`npm start` or the desktop shortcut). Check the Dashboard for open biltis and vouchers awaiting patti. / ڈیش بورڈ پر کھلی بلٹیاں اور پٹی کے منتظر واؤچرز دیکھیں۔
2. **بلٹی بنائیں — New bilti:** When a truck arrives, go to Bilti → New Bilti. Fill the truck number, item, and total crates, then set the expense rate card (Kiraya/Mazdoori/Munshiyana/Daak/Bardana/Peshgi). / ٹرک پہنچنے پر نئی بلٹی بنائیں اور ریٹ کارڈ درج کریں۔
3. **واؤچر اور لاٹ — Vouchers and lots:** Add one voucher per vendor on that truck, then the lots as graded. / ہر کاشتکار کے لیے واؤچر اور لاٹس شامل کریں۔
4. **فروخت درج کریں — Record sales:** Inside each lot, use the fast entry row — pick the customer, enter crates and the actual rate, press Enter. The rate difference shows live. / ہر لاٹ میں کریٹ اور اصل ریٹ درج کریں، Enter دبائیں۔
5. **پٹی بنائیں — Generate the patti:** Once a voucher's crates are fully sold, click Generate Patti, print it, and pay the vendor from the Cash Book. / تمام کریٹ فروخت ہونے پر پٹی بنائیں، پرنٹ کریں، اور ادائیگی کریں۔
6. **وصولی — Recoveries:** As customers pay, record it in Wasooli. / خریدار کی ادائیگی وصولی میں درج کریں۔
7. **رات — End of day:** Check the Cash Book day sheet balances, and the dashboard's oldest outstanding customers. / دن کے اختتام پر کیش بک اور بقایا جات چیک کریں۔

## What's implemented vs. simplified

Everything in spec sections 1–11 has a working screen and posts correct double-entry journal entries, verified by the automated tests above. Given the scope of this brief, a few things are intentionally lighter-weight for this pass (listed above under Assumptions) — role-based login enforcement being the main one worth revisiting first.
