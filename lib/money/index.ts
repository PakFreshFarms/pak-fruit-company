// All money in this application is stored as an integer number of paisa.
// 1 rupee = 100 paisa. Never use floating point for money.

/** Convert a rupee amount (may be fractional, e.g. from a form input) to integer paisa. */
export function toPaisa(rupees: number | string): number {
  const n = typeof rupees === "string" ? Number(rupees.replace(/,/g, "")) : rupees;
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

/** Convert integer paisa to a rupee number (for calculations that need a float, e.g. chart axes). */
export function toRupees(paisa: number): number {
  return paisa / 100;
}

/** Format paisa as a PKR string with thousands separators, e.g. "1,234.50". Negative shown with a leading minus, never brackets. */
export function formatPKR(paisa: number, opts?: { withSymbol?: boolean; decimals?: boolean }): string {
  const withSymbol = opts?.withSymbol ?? true;
  const decimals = opts?.decimals ?? true;
  const negative = paisa < 0;
  const abs = Math.abs(paisa);
  const rupees = Math.floor(abs / 100);
  const paisaPart = abs % 100;
  const rupeesStr = rupees.toLocaleString("en-US");
  const body = decimals ? `${rupeesStr}.${String(paisaPart).padStart(2, "0")}` : rupeesStr;
  const prefix = negative ? "-" : "";
  const symbol = withSymbol ? "Rs " : "";
  return `${prefix}${symbol}${body}`;
}

/** Format a number in words (Pakistani numbering: lakh/crore) for the patti "amount in words" line. */
export function amountInWords(paisa: number): string {
  const rupees = Math.round(Math.abs(paisa) / 100);
  if (rupees === 0) return "Zero Rupees Only";
  const words = numberToWordsIndian(rupees);
  const sign = paisa < 0 ? "Minus " : "";
  return `${sign}${words} Rupees Only`;
}

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  return `${TENS[Math.floor(n / 10)]}${n % 10 ? " " + ONES[n % 10] : ""}`;
}

function threeDigits(n: number): string {
  if (n < 100) return twoDigits(n);
  const rest = n % 100;
  return `${ONES[Math.floor(n / 100)]} Hundred${rest ? " " + twoDigits(rest) : ""}`;
}

/** Indian/Pakistani numbering system: crore, lakh, thousand, hundred. */
function numberToWordsIndian(n: number): string {
  if (n === 0) return "Zero";
  const crore = Math.floor(n / 1_00_00_000);
  n %= 1_00_00_000;
  const lakh = Math.floor(n / 1_00_000);
  n %= 1_00_000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const hundred = n;

  const parts: string[] = [];
  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${threeDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigits(thousand)} Thousand`);
  if (hundred) parts.push(threeDigits(hundred));
  return parts.join(" ");
}

/** Split a truck-total amount across voucher crate counts, rounding remainder onto the largest voucher (rule 4.4 / 6.5). */
export function splitTruckTotal(
  totalPaisa: number,
  vouchers: { id: string; crates: number }[],
  biltiTotalCrates: number,
): Record<string, number> {
  const result: Record<string, number> = {};
  let allocated = 0;
  for (const v of vouchers) {
    const share = Math.round((totalPaisa * v.crates) / biltiTotalCrates);
    result[v.id] = share;
    allocated += share;
  }
  const remainder = totalPaisa - allocated;
  if (remainder !== 0 && vouchers.length > 0) {
    const largest = vouchers.reduce((a, b) => (b.crates > a.crates ? b : a));
    result[largest.id] += remainder;
  }
  return result;
}
