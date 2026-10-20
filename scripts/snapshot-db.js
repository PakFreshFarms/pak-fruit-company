const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const p = new PrismaClient();

function hash(obj) {
  return crypto.createHash("sha256").update(JSON.stringify(obj)).digest("hex").slice(0, 16);
}

async function main() {
  const tables = [
    "account",
    "journalEntry",
    "journalLine",
    "bilti",
    "biltiExpense",
    "voucher",
    "lot",
    "sale",
    "farm",
    "farmExpense",
    "farmDispatch",
    "cashEntry",
    "user",
    "setting",
    "itemExpenseDefault",
    "backup",
  ];

  const counts = {};
  for (const t of tables) {
    counts[t] = await p[t].count();
  }
  console.log("ROW COUNTS:", JSON.stringify(counts, null, 2));

  // Content hashes of full, order-independent table contents (sorted by id) to catch any row-level corruption.
  const hashes = {};
  for (const t of tables) {
    const rows = await p[t].findMany({ orderBy: { id: "asc" } });
    hashes[t] = hash(rows);
  }
  console.log("CONTENT HASHES:", JSON.stringify(hashes, null, 2));

  // A few specific spot-check values that matter most (balances, totals).
  const ahmedBalanceLines = await p.journalLine.findMany({ where: { account: { name: "Ahmed" } } });
  const ahmedBalance = ahmedBalanceLines.reduce((s, l) => s + l.debit - l.credit, 0);
  console.log("Ahmed balance (paisa):", ahmedBalance);

  const totalDebit = await p.journalLine.aggregate({ _sum: { debit: true } });
  const totalCredit = await p.journalLine.aggregate({ _sum: { credit: true } });
  console.log("Grand total debit:", totalDebit._sum.debit, "Grand total credit:", totalCredit._sum.credit);

  const pattiCount = await p.voucher.count({ where: { pattiNo: { not: null } } });
  console.log("Pattis issued:", pattiCount);

  await p.$disconnect();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
