-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameUr" TEXT,
    "type" TEXT NOT NULL,
    "openingBalance" INTEGER NOT NULL DEFAULT 0,
    "phone" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "refType" TEXT NOT NULL,
    "refId" TEXT,
    "narration" TEXT NOT NULL,
    "narrationKey" TEXT,
    "narrationParams" TEXT,
    "isPosted" BOOLEAN NOT NULL DEFAULT true,
    "isReversed" BOOLEAN NOT NULL DEFAULT false,
    "reversalOf" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "JournalLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entryId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "debit" INTEGER NOT NULL DEFAULT 0,
    "credit" INTEGER NOT NULL DEFAULT 0,
    "farmId" TEXT,
    "vendorTagId" TEXT,
    "narration" TEXT,
    CONSTRAINT "JournalLine_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "JournalEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JournalLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "JournalLine_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Bilti" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "biltiNo" TEXT NOT NULL,
    "truckNo" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "itemName" TEXT NOT NULL,
    "totalCrates" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BiltiExpense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "biltiId" TEXT NOT NULL,
    "head" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "basis" TEXT NOT NULL,
    "rate" INTEGER NOT NULL,
    "expenseAccountId" TEXT NOT NULL,
    CONSTRAINT "BiltiExpense_biltiId_fkey" FOREIGN KEY ("biltiId") REFERENCES "Bilti" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BiltiExpense_expenseAccountId_fkey" FOREIGN KEY ("expenseAccountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Voucher" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "biltiId" TEXT NOT NULL,
    "voucherNo" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "crates" INTEGER NOT NULL,
    "kirayaOverride" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "pattiNo" TEXT,
    "pattiDate" DATETIME,
    "closedWithUnsold" BOOLEAN NOT NULL DEFAULT false,
    "closeReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Voucher_biltiId_fkey" FOREIGN KEY ("biltiId") REFERENCES "Bilti" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Voucher_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Lot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "voucherId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "crates" INTEGER NOT NULL,
    "reportRate" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Lot_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "Voucher" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lotId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "customerId" TEXT NOT NULL,
    "crates" INTEGER NOT NULL,
    "actualRate" INTEGER NOT NULL,
    "journalEntryId" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" DATETIME,
    "cancelledBy" TEXT,
    CONSTRAINT "Sale_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Farm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "landownerName" TEXT NOT NULL,
    "rentAmount" INTEGER NOT NULL,
    "rentPaid" INTEGER NOT NULL DEFAULT 0,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "closedAt" DATETIME,
    "closedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FarmExpense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farmId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "head" TEXT NOT NULL,
    "payeeName" TEXT,
    "payeeAccountId" TEXT,
    "amount" INTEGER NOT NULL,
    "narration" TEXT,
    "journalEntryId" TEXT NOT NULL,
    CONSTRAINT "FarmExpense_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FarmExpense_payeeAccountId_fkey" FOREIGN KEY ("payeeAccountId") REFERENCES "Account" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FarmDispatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farmId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "truckNo" TEXT NOT NULL,
    "crates" INTEGER NOT NULL,
    "netSaleAmount" INTEGER NOT NULL DEFAULT 0,
    "marketName" TEXT,
    "chargeCommission" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "journalEntryId" TEXT,
    CONSTRAINT "FarmDispatch_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CashEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "book" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "mode" TEXT NOT NULL,
    "reference" TEXT,
    "narration" TEXT NOT NULL,
    "journalEntryId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CashEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MUNSHI',
    "pinHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ItemExpenseDefault" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemName" TEXT NOT NULL,
    "head" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "basis" TEXT NOT NULL,
    "rate" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Backup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filePath" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sizeBytes" INTEGER NOT NULL,
    "auto" BOOLEAN NOT NULL DEFAULT false
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_code_key" ON "Account"("code");

-- CreateIndex
CREATE INDEX "Account_type_idx" ON "Account"("type");

-- CreateIndex
CREATE INDEX "JournalEntry_refType_refId_idx" ON "JournalEntry"("refType", "refId");

-- CreateIndex
CREATE INDEX "JournalEntry_date_idx" ON "JournalEntry"("date");

-- CreateIndex
CREATE INDEX "JournalLine_accountId_idx" ON "JournalLine"("accountId");

-- CreateIndex
CREATE INDEX "JournalLine_farmId_idx" ON "JournalLine"("farmId");

-- CreateIndex
CREATE INDEX "JournalLine_vendorTagId_idx" ON "JournalLine"("vendorTagId");

-- CreateIndex
CREATE UNIQUE INDEX "Bilti_biltiNo_key" ON "Bilti"("biltiNo");

-- CreateIndex
CREATE INDEX "Bilti_status_idx" ON "Bilti"("status");

-- CreateIndex
CREATE INDEX "Bilti_date_idx" ON "Bilti"("date");

-- CreateIndex
CREATE INDEX "BiltiExpense_biltiId_idx" ON "BiltiExpense"("biltiId");

-- CreateIndex
CREATE UNIQUE INDEX "Voucher_pattiNo_key" ON "Voucher"("pattiNo");

-- CreateIndex
CREATE INDEX "Voucher_vendorId_idx" ON "Voucher"("vendorId");

-- CreateIndex
CREATE INDEX "Voucher_status_idx" ON "Voucher"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Voucher_biltiId_voucherNo_key" ON "Voucher"("biltiId", "voucherNo");

-- CreateIndex
CREATE INDEX "Lot_voucherId_idx" ON "Lot"("voucherId");

-- CreateIndex
CREATE INDEX "Sale_lotId_idx" ON "Sale"("lotId");

-- CreateIndex
CREATE INDEX "Sale_customerId_idx" ON "Sale"("customerId");

-- CreateIndex
CREATE INDEX "Sale_cancelledAt_idx" ON "Sale"("cancelledAt");

-- CreateIndex
CREATE INDEX "Farm_isClosed_idx" ON "Farm"("isClosed");

-- CreateIndex
CREATE INDEX "FarmExpense_farmId_idx" ON "FarmExpense"("farmId");

-- CreateIndex
CREATE INDEX "FarmExpense_date_idx" ON "FarmExpense"("date");

-- CreateIndex
CREATE INDEX "FarmDispatch_farmId_idx" ON "FarmDispatch"("farmId");

-- CreateIndex
CREATE INDEX "FarmDispatch_status_idx" ON "FarmDispatch"("status");

-- CreateIndex
CREATE INDEX "CashEntry_book_date_idx" ON "CashEntry"("book", "date");

-- CreateIndex
CREATE INDEX "CashEntry_accountId_idx" ON "CashEntry"("accountId");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ItemExpenseDefault_itemName_head_key" ON "ItemExpenseDefault"("itemName", "head");
