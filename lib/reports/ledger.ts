import { prisma } from "@/lib/db/prisma";
import { getSystemAccountId } from "@/lib/accounting/system-accounts";

export interface LedgerRow {
  date: Date;
  narration: string;
  refType: string;
  debit: number;
  credit: number;
  runningBalance: number;
  isReversed: boolean;
}

/** An account's running ledger from posted journal lines. Rate Difference lines never appear here because they post to the Rate Difference account, not the vendor/customer account — the vendorTagId on those lines is for reporting only (rule 6.3). */
export async function getAccountLedger(accountId: string): Promise<LedgerRow[]> {
  const lines = await prisma.journalLine.findMany({
    where: { accountId },
    include: { entry: true },
    orderBy: [{ entry: { date: "asc" } }, { entry: { createdAt: "asc" } }],
  });

  let running = 0;
  const rows: LedgerRow[] = [];
  for (const line of lines) {
    if (line.entry.isReversed) continue;
    running += line.debit - line.credit;
    rows.push({
      date: line.entry.date,
      narration: line.entry.narration,
      refType: line.entry.refType,
      debit: line.debit,
      credit: line.credit,
      runningBalance: running,
      isReversed: false,
    });
  }
  return rows;
}

/** Rate Difference given/recovered/net for one vendor, sourced purely from vendorTagId — never touches the vendor's own account balance (rule 6.3). */
export async function getVendorRateDifferencePosition(vendorId: string) {
  const rateDiffId = await getSystemAccountId("RATE_DIFFERENCE");
  const lines = await prisma.journalLine.findMany({
    where: { accountId: rateDiffId, vendorTagId: vendorId, entry: { isReversed: false } },
  });
  const given = lines.reduce((s, l) => s + l.debit, 0); // concessions absorbed for this vendor
  const recovered = lines.reduce((s, l) => s + l.credit, 0); // gains recovered from this vendor
  return { given, recovered, net: recovered - given };
}
