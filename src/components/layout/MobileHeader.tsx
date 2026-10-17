"use client";

import { Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Logo } from "@/components/brand/Logo";
import { FeedTabs } from "./FeedTabs";

export function MobileHeader() {
  const t = useTranslations("app");
  const ts = useTranslations("settings");
  const pathname = usePathname();
  const showTabs = pathname === "/";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur md:hidden">
      <div className="flex min-h-12 items-center justify-between px-4">
        <Link
          href="/"
          aria-label={t("name")}
          className="inline-flex min-h-11 items-center rounded-full focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Logo size={28} />
        </Link>
        <Link
          href="/settings"
          aria-label={ts("title")}
          className="inline-flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Settings className="size-5" aria-hidden="true" />
        </Link>
      </div>
      {showTabs ? (
        <div className="border-t border-border">
          <FeedTabs />
        </div>
      ) : null}
    </header>
  );
}
