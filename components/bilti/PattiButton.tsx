"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { generatePattiAction } from "@/app/actions/patti";
import { ScrollText } from "lucide-react";

export function PattiButton({ voucherId, biltiId, fullySold, remaining }: { voucherId: string; biltiId: string; fullySold: boolean; remaining: number }) {
  const t = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [closeWithUnsold, setCloseWithUnsold] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function generate() {
    setSubmitting(true);
    const res = await generatePattiAction({
      voucherId,
      biltiId,
      closeWithUnsold: !fullySold,
      closeReason: !fullySold ? reason : undefined,
    });
    setSubmitting(false);
    if (res.ok) {
      toast.success(`${res.pattiNo} generated`);
      setOpen(false);
      router.push(`/bilti/${biltiId}/voucher/${voucherId}/patti`);
    } else {
      toast.error(res.error ?? t("common.error"));
    }
  }

  if (fullySold) {
    return (
      <Button size="sm" onClick={generate} disabled={submitting}>
        <ScrollText className="size-4" />
        {t("bilti.generatePatti")}
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <ScrollText className="size-4" />
          {t("bilti.generatePatti")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("bilti.generatePatti")}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {remaining} {t("common.crates")} {t("bilti.remainingCrates").toLowerCase()}.
        </p>
        <div className="flex items-center gap-2">
          <Checkbox id="closeWithUnsold" checked={closeWithUnsold} onCheckedChange={(v) => setCloseWithUnsold(!!v)} />
          <Label htmlFor="closeWithUnsold">{t("bilti.closeWithUnsold")}</Label>
        </div>
        {closeWithUnsold && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reason">{t("bilti.closeReason")}</Label>
            <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={generate} disabled={!closeWithUnsold || !reason.trim() || submitting}>
            {t("common.generate")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
