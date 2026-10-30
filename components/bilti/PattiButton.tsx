"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { generatePattiAction } from "@/app/actions/patti";
import { ScrollText } from "lucide-react";

/**
 * "Save Voucher" — only rendered once a voucher is 100% sold (spec: a
 * voucher is complete only when its full crate quantity has been sold,
 * no partial-completion override). Posts the patti/commission and flips
 * the voucher to COMPLETE.
 */
export function PattiButton({ voucherId, biltiId }: { voucherId: string; biltiId: string }) {
  const t = useTranslation();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function generate() {
    setSubmitting(true);
    const res = await generatePattiAction({ voucherId, biltiId });
    setSubmitting(false);
    if (res.ok) {
      toast.success(`${res.pattiNo} generated`);
      router.push(`/bilti/${biltiId}/voucher/${voucherId}/patti`);
    } else {
      toast.error(res.error ?? t("common.error"));
    }
  }

  return (
    <Button onClick={generate} disabled={submitting} className="bg-success hover:opacity-90">
      <ScrollText className="size-5" />
      {t("bilti.saveVoucher")}
    </Button>
  );
}
