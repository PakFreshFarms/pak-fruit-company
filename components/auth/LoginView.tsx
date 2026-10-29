"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/LocaleProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginAction } from "@/app/actions/auth";
import { User as UserIcon, ArrowLeft } from "lucide-react";

interface LoginUser {
  id: string;
  name: string;
  role: "OWNER" | "MUNSHI";
}

export function LoginView({ users }: { users: LoginUser[] }) {
  const t = useTranslation();
  const router = useRouter();
  const [selected, setSelected] = useState<LoginUser | null>(null);
  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const pinRef = useRef<HTMLInputElement>(null);

  function selectUser(u: LoginUser) {
    setSelected(u);
    setPin("");
    requestAnimationFrame(() => pinRef.current?.focus());
  }

  async function submit() {
    if (!selected || !pin) return;
    setSubmitting(true);
    const res = await loginAction({ userId: selected.id, pin });
    setSubmitting(false);
    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      toast.error(t(`auth.${res.error}`) !== `auth.${res.error}` ? t(`auth.${res.error}`) : res.error);
      setPin("");
      pinRef.current?.focus();
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-md bg-primary text-lg font-bold text-primary-foreground">
            م
          </div>
          <div className="text-lg font-bold">{t("app.name")}</div>
          <div className="text-xs text-muted-foreground">{t("app.tagline")}</div>
        </div>

        {!selected ? (
          <>
            <p className="mb-3 text-center text-sm text-muted-foreground">{t("auth.whoAreYou")}</p>
            <div className="flex flex-col gap-2">
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => selectUser(u)}
                  className="flex items-center gap-3 rounded-md border border-border px-4 py-3 text-left text-sm hover:bg-muted"
                >
                  <UserIcon className="size-4 text-muted-foreground" />
                  <span className="flex-1 font-medium">{u.name}</span>
                  <span className="text-xs text-muted-foreground">{u.role === "OWNER" ? t("auth.owner") : t("auth.munshi")}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => setSelected(null)}
              className="mb-4 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-3" /> {t("auth.backToUserList")}
            </button>
            <p className="mb-3 text-sm font-medium">{selected.name}</p>
            <div className="flex flex-col gap-3">
              <Input
                ref={pinRef}
                type="password"
                inputMode="numeric"
                placeholder={t("auth.enterPin")}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                autoFocus
              />
              <Button onClick={submit} disabled={submitting || !pin}>
                {t("auth.signInButton")}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
