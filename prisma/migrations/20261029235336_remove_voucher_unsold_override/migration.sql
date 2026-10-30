-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Voucher" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "biltiId" TEXT NOT NULL,
    "voucherNo" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "crates" INTEGER NOT NULL,
    "kirayaOverride" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "pattiNo" TEXT,
    "pattiDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Voucher_biltiId_fkey" FOREIGN KEY ("biltiId") REFERENCES "Bilti" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Voucher_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Voucher" ("biltiId", "crates", "createdAt", "id", "kirayaOverride", "pattiDate", "pattiNo", "status", "updatedAt", "vendorId", "voucherNo") SELECT "biltiId", "crates", "createdAt", "id", "kirayaOverride", "pattiDate", "pattiNo", "status", "updatedAt", "vendorId", "voucherNo" FROM "Voucher";
DROP TABLE "Voucher";
ALTER TABLE "new_Voucher" RENAME TO "Voucher";
CREATE UNIQUE INDEX "Voucher_pattiNo_key" ON "Voucher"("pattiNo");
CREATE INDEX "Voucher_vendorId_idx" ON "Voucher"("vendorId");
CREATE INDEX "Voucher_status_idx" ON "Voucher"("status");
CREATE UNIQUE INDEX "Voucher_biltiId_voucherNo_key" ON "Voucher"("biltiId", "voucherNo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
