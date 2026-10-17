"use client";

import { useState } from "react";
import { Feather } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ChirpButton({
  className,
  labelClassName,
}: {
  className?: string;
  labelClassName?: string;
}) {
  const t = useTranslations("chirp");
  const [pulse, setPulse] = useState(0);

  return (
    <button
      type="button"
      aria-label={t("action")}
      onClick={() => {
        setPulse((value) => value + 1);
        toast(t("notReady"));
      }}
      className={cn(
        "relative inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-5 font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      {pulse > 0 ? (
        <span
          key={pulse}
          aria-hidden="true"
          onAnimationEnd={() => setPulse(0)}
          className="animate-chirp-pulse pointer-events-none absolute inset-0 rounded-full border-2 border-primary"
        />
      ) : null}
      <Feather className="size-5" aria-hidden="true" />
      <span className={cn(labelClassName)}>{t("action")}</span>
    </button>
  );
}
