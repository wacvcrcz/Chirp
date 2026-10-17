"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const LABELS: Record<Locale, string> = { en: "English", ar: "العربية" };

export function LanguageToggle() {
  const t = useTranslations("settings");
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <div
      role="group"
      aria-label={t("language")}
      className="flex w-fit gap-1 rounded-full bg-muted p-1"
    >
      {routing.locales.map((option) => {
        const active = option === locale;
        return (
          <Link
            key={option}
            href={pathname}
            locale={option}
            lang={option}
            aria-current={active ? "true" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {LABELS[option]}
          </Link>
        );
      })}
    </div>
  );
}
