"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { Money } from "@/components/shared/Money";
import { AccountCombobox, type ComboboxAccount } from "@/components/shared/AccountCombobox";
import { RateCard } from "./RateCard";
import { PattiButton } from "./PattiButton";
import { VoucherSaleEntry } from "./VoucherSaleEntry";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { createBiltiAction, addVoucherAction, updateVoucherKirayaOverrideAction } from "@/app/actions/bilti";
import Link from "next/link";
import type { ExpenseBasis } from "@prisma/client";

interface BiltiData {
  id: string;
  biltiNo: string;
  truckNo: string;
  date: string;
  itemName: string;
  totalCrates: number;
  status: "OPEN" | "COMPLETE";
  expenses: { id: string; head: string; label: string; basis: ExpenseBasis; rate: number }[];
}

export interface VoucherSummary {
  id: string;
  voucherNo: string;
  vendorId: string;
  vendorName: string;
  crates: number;
  kirayaOverride: number | null;
  status: "OPEN" | "COMPLETE";
  pattiNo: string | null;
  soldCrates: number;
  lots: {
    id: string;
    name: string;
    crates: number;
    reportRate: number;
    soldCrates: number;
    sales: { id: string; date: string; customerId: string; customerName: string; crates: number; actualRate: number }[];
  }[];
}

const BILTI_FIELD_IDS = ["sb-biltiNo", "sb-truckNo", "sb-date", "sb-itemName", "sb-totalCrates"];
const VOUCHER_VENDOR_ID = "sb-voucher-vendor";
const VOUCHER_FIELD_IDS = [VOUCHER_VENDOR_ID, "sb-voucherNo", "sb-voucherCrates", "sb-voucherKiraya"];

function focusById(id: string) {
  document.getElementById(id)?.focus();
}

function enterAdvances(nextId: string | (() => void)) {
  return (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (typeof nextId === "string") focusById(nextId);
    else nextId();
  };
}

export function SalesBookView({
  bilti,
  vouchers,
  assignedCrates,
  vendors,
  customers,
  shopName,
  shopAddress,
}: {
  bilti: BiltiData | null;
  vouchers: VoucherSummary[];
  assignedCrates: number;
  vendors: ComboboxAccount[];
  customers: ComboboxAccount[];
  shopName: string;
  shopAddress: string;
}) {
  const t = useTranslation();
  const router = useRouter();

  // ---------- Bilti block (create mode only) ----------
  const [creatingBilti, setCreatingBilti] = useState(false);
  const [biltiForm, setBiltiForm] = useState({
    biltiNo: "",
    truckNo: "",
    date: format(new Date(), "yyyy-MM-dd"),
    itemName: "",
    totalCrates: "",
  });

  async function submitBilti() {
    if (!biltiForm.biltiNo || !biltiForm.truckNo || !biltiForm.itemName || !biltiForm.totalCrates) {
      toast.error(t("common.required"));
      return;
    }
    setCreatingBilti(true);
    const res = await createBiltiAction({
      biltiNo: biltiForm.biltiNo,
      truckNo: biltiForm.truckNo,
      date: new Date(biltiForm.date),
      itemName: biltiForm.itemName,
      totalCrates: Number(biltiForm.totalCrates),
    });
    setCreatingBilti(false);
    if (res.ok && res.id) {
      router.replace(`/bilti/${res.id}`);
    } else {
      toast.error(res.error ?? t("common.error"));
    }
  }

  // ---------- Voucher block ----------
  const serverActiveVoucher = vouchers.find((v) => v.status === "OPEN") ?? null;
  const completedVouchers = vouchers.filter((v) => v.status === "COMPLETE");
  const [activeVoucher, setActiveVoucher] = useState<VoucherSummary | null>(serverActiveVoucher);

  useEffect(() => {
    setActiveVoucher(vouchers.find((v) => v.status === "OPEN") ?? null);
  }, [vouchers]);

  const biltiUnassigned = bilti ? bilti.totalCrates - assignedCrates : 0;

  const [voucherForm, setVoucherForm] = useState({ vendorId: "", voucherNo: "", crates: "", kirayaOverride: "" });
  const [creatingVoucher, setCreatingVoucher] = useState(false);

  async function submitVoucher() {
    if (!bilti) return;
    if (!voucherForm.vendorId || !voucherForm.voucherNo || !voucherForm.crates) {
      toast.error(t("common.required"));
      return;
    }
    setCreatingVoucher(true);
    const res = await addVoucherAction({
      biltiId: bilti.id,
      voucherNo: voucherForm.voucherNo,
      vendorId: voucherForm.vendorId,
      crates: Number(voucherForm.crates),
      kirayaOverride: voucherForm.kirayaOverride ? Number(voucherForm.kirayaOverride) : undefined,
    });
    setCreatingVoucher(false);
    if (res.ok && res.id) {
      const vendor = vendors.find((v) => v.id === voucherForm.vendorId);
      setActiveVoucher({
        id: res.id,
        voucherNo: voucherForm.voucherNo,
        vendorId: voucherForm.vendorId,
        vendorName: vendor?.name ?? "",
        crates: Number(voucherForm.crates),
        kirayaOverride: voucherForm.kirayaOverride ? Number(voucherForm.kirayaOverride) * 100 : null,
        status: "OPEN",
        pattiNo: null,
        soldCrates: 0,
        lots: [],
      });
      setVoucherForm({ vendorId: "", voucherNo: "", crates: "", kirayaOverride: "" });
      router.refresh();
    } else {
      toast.error(res.error ?? t("common.error"));
    }
  }

  const [kiraya, setKiraya] = useState("");
  useEffect(() => {
    setKiraya(activeVoucher?.kirayaOverride != null ? (activeVoucher.kirayaOverride / 100).toString() : "");
  }, [activeVoucher?.id, activeVoucher?.kirayaOverride]);

  async function saveKiraya() {
    if (!activeVoucher || !bilti) return;
    const res = await updateVoucherKirayaOverrideAction({
      voucherId: activeVoucher.id,
      biltiId: bilti.id,
      kirayaOverride: kiraya ? Number(kiraya) : null,
    });
    if (!res.ok) toast.error(res.error ?? t("common.error"));
  }

  function onVoucherSaved() {
    router.refresh();
  }

  const remaining = activeVoucher ? activeVoucher.crates - activeVoucher.soldCrates : 0;

  return (
    <div>
      <PageHeader
        title={bilti ? `${t("bilti.title")} ${bilti.biltiNo}` : t("bilti.addBilti")}
        subtitle={bilti ? `${bilti.truckNo} · ${format(new Date(bilti.date), "dd MMM yyyy")} · ${bilti.itemName}` : undefined}
        actions={bilti && <Badge variant={bilti.status === "COMPLETE" ? "success" : "outline"}>{t(`bilti.status_${bilti.status}`)}</Badge>}
      />

      {/* ---------- Region 1: Bilti block ---------- */}
      <div className="mb-6 rounded-xl border-2 p-5" style={{ borderColor: "#15803d", backgroundColor: "#15803d0d" }}>
        {!bilti ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={BILTI_FIELD_IDS[0]}>{t("bilti.biltiNo")}</Label>
              <Input
                id={BILTI_FIELD_IDS[0]}
                autoFocus
                value={biltiForm.biltiNo}
                onChange={(e) => setBiltiForm((f) => ({ ...f, biltiNo: e.target.value }))}
                onKeyDown={enterAdvances(BILTI_FIELD_IDS[1])}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={BILTI_FIELD_IDS[1]}>{t("bilti.truckNo")}</Label>
              <Input
                id={BILTI_FIELD_IDS[1]}
                value={biltiForm.truckNo}
                onChange={(e) => setBiltiForm((f) => ({ ...f, truckNo: e.target.value }))}
                onKeyDown={enterAdvances(BILTI_FIELD_IDS[2])}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={BILTI_FIELD_IDS[2]}>{t("common.date")}</Label>
              <Input
                id={BILTI_FIELD_IDS[2]}
                type="date"
                value={biltiForm.date}
                onChange={(e) => setBiltiForm((f) => ({ ...f, date: e.target.value }))}
                onKeyDown={enterAdvances(BILTI_FIELD_IDS[3])}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={BILTI_FIELD_IDS[3]}>{t("bilti.itemName")}</Label>
              <Input
                id={BILTI_FIELD_IDS[3]}
                placeholder="Mango"
                value={biltiForm.itemName}
                onChange={(e) => setBiltiForm((f) => ({ ...f, itemName: e.target.value }))}
                onKeyDown={enterAdvances(BILTI_FIELD_IDS[4])}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={BILTI_FIELD_IDS[4]}>{t("bilti.totalCrates")}</Label>
              <Input
                id={BILTI_FIELD_IDS[4]}
                type="number"
                value={biltiForm.totalCrates}
                disabled={creatingBilti}
                onChange={(e) => setBiltiForm((f) => ({ ...f, totalCrates: e.target.value }))}
                onKeyDown={enterAdvances(submitBilti)}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap gap-6 text-base">
              <div>
                {t("bilti.totalCrates")}: <span className="font-bold">{bilti.totalCrates}</span>
              </div>
              <div>
                {t("bilti.assignedCrates")}: <span className="font-bold">{assignedCrates}</span>
              </div>
              <div>
                {t("bilti.unassignedCrates")}: <span className="font-bold">{biltiUnassigned}</span>
              </div>
            </div>
            <RateCard biltiId={bilti.id} expenses={bilti.expenses} locked={vouchers.some((v) => v.status === "COMPLETE")} />
          </>
        )}
      </div>

      {bilti && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr]">
          {/* ---------- Region 2: Voucher block ---------- */}
          <div>
            <div className="mb-4 rounded-xl border-2 p-5" style={{ borderColor: "#2563eb", backgroundColor: "#2563eb0d" }}>
              {activeVoucher ? (
                <>
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <div className="text-lg font-bold">
                        {t("bilti.voucherNo")} {activeVoucher.voucherNo} — {activeVoucher.vendorName}
                      </div>
                      <div className="text-base text-muted-foreground">
                        {activeVoucher.soldCrates}/{activeVoucher.crates} {t("common.crates")}
                      </div>
                    </div>
                    <VoucherProgress sold={activeVoucher.soldCrates} total={activeVoucher.crates} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="sb-active-kiraya">{t("bilti.kirayaOverride")}</Label>
                    <Input
                      id="sb-active-kiraya"
                      type="number"
                      step="0.01"
                      value={kiraya}
                      placeholder={t("bilti.useBiltiRate")}
                      onChange={(e) => setKiraya(e.target.value)}
                      onBlur={saveKiraya}
                    />
                  </div>
                </>
              ) : biltiUnassigned > 0 ? (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={VOUCHER_VENDOR_ID}>{t("vocab.vendor")}</Label>
                    <AccountCombobox
                      id={VOUCHER_VENDOR_ID}
                      accounts={vendors}
                      value={voucherForm.vendorId || undefined}
                      onChange={(id) => {
                        setVoucherForm((f) => ({ ...f, vendorId: id }));
                        focusById(VOUCHER_FIELD_IDS[1]);
                      }}
                      placeholder={t("vocab.vendor")}
                      allowCreate={{ type: "VENDOR" }}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={VOUCHER_FIELD_IDS[1]}>{t("bilti.voucherNo")}</Label>
                    <Input
                      id={VOUCHER_FIELD_IDS[1]}
                      value={voucherForm.voucherNo}
                      onChange={(e) => setVoucherForm((f) => ({ ...f, voucherNo: e.target.value }))}
                      onKeyDown={enterAdvances(VOUCHER_FIELD_IDS[2])}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={VOUCHER_FIELD_IDS[2]}>{t("common.crates")}</Label>
                    <Input
                      id={VOUCHER_FIELD_IDS[2]}
                      type="number"
                      value={voucherForm.crates}
                      onChange={(e) => setVoucherForm((f) => ({ ...f, crates: e.target.value }))}
                      onKeyDown={enterAdvances(VOUCHER_FIELD_IDS[3])}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={VOUCHER_FIELD_IDS[3]}>{t("bilti.kirayaOverride")}</Label>
                    <Input
                      id={VOUCHER_FIELD_IDS[3]}
                      type="number"
                      step="0.01"
                      placeholder={t("bilti.useBiltiRate")}
                      value={voucherForm.kirayaOverride}
                      disabled={creatingVoucher}
                      onChange={(e) => setVoucherForm((f) => ({ ...f, kirayaOverride: e.target.value }))}
                      onKeyDown={enterAdvances(submitVoucher)}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-base text-muted-foreground">{t("bilti.allCratesAssigned")}</p>
              )}
            </div>

            {completedVouchers.length > 0 && (
              <div>
                <h3 className="mb-2 text-base font-bold text-muted-foreground">{t("bilti.vouchers")}</h3>
                <div className="flex flex-col gap-2">
                  {completedVouchers.map((v) => (
                    <Link
                      key={v.id}
                      href={`/bilti/${bilti.id}/voucher/${v.id}/patti`}
                      className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
                    >
                      <span className="font-medium">
                        {v.voucherNo} — {v.vendorName}
                      </span>
                      <div className="flex items-center gap-3">
                        <Badge variant="success">{v.pattiNo}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {v.soldCrates}/{v.crates}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ---------- Region 3: Sale entry area ---------- */}
          <div className="rounded-xl border-2 p-5" style={{ borderColor: "#d97706", backgroundColor: "#d977060d" }}>
            {activeVoucher ? (
              <>
                <VoucherSaleEntry
                  biltiId={bilti.id}
                  voucherId={activeVoucher.id}
                  lots={activeVoucher.lots}
                  customers={customers}
                  onSaved={onVoucherSaved}
                />
                <div className="mt-4 border-t-2 border-border pt-4">
                  <h4 className="mb-2 text-base font-bold text-muted-foreground">{t("bilti.sales")}</h4>
                  {activeVoucher.lots.flatMap((l) => l.sales).length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("common.noResults")}</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {activeVoucher.lots.flatMap((lot) =>
                        lot.sales.map((s) => (
                          <div key={s.id} className="flex items-center justify-between rounded-lg bg-card px-4 py-2.5">
                            <div className="text-sm">
                              <span className="font-semibold">{s.customerName}</span>
                              <span className="text-muted-foreground"> · {lot.name} · {s.crates} {t("common.crates")}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Money paisa={s.crates * s.actualRate} className="font-semibold" />
                              <SaleReceiptButton
                                shopName={shopName}
                                shopAddress={shopAddress}
                                sale={{
                                  date: s.date,
                                  biltiNo: bilti.biltiNo,
                                  truckNo: bilti.truckNo,
                                  lotName: lot.name,
                                  customerName: s.customerName,
                                  crates: s.crates,
                                  actualRate: s.actualRate,
                                }}
                              />
                            </div>
                          </div>
                        )),
                      )}
                    </div>
                  )}
                </div>
                {remaining === 0 && activeVoucher.lots.length > 0 && (
                  <div className="mt-4 flex justify-end">
                    <PattiButton voucherId={activeVoucher.id} biltiId={bilti.id} />
                  </div>
                )}
              </>
            ) : (
              <p className="text-base text-muted-foreground">{t("bilti.addVoucherFirst")}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function VoucherProgress({ sold, total }: { sold: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((sold / total) * 100)) : 0;
  const done = sold >= total && total > 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-3 w-28 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: done ? "#15803d" : "#2563eb" }} />
      </div>
      <span className="text-sm font-bold tabular-nums">{pct}%</span>
    </div>
  );
}

// Thin re-export so SaleReceipt's own file doesn't need importing here twice under a different name.
import { SaleReceipt as SaleReceiptButton } from "./SaleReceipt";
