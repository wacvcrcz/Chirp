"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type FeedTab = "forYou" | "following";

function TabsRow({ active }: { active: FeedTab }) {
  const t = useTranslations("feed");

  const tabClass = (isActive: boolean) =>
    cn(
      "relative flex min-h-11 flex-1 items-center justify-center px-3 text-[15px] transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50",
      isActive
        ? "font-semibold text-foreground after:absolute after:inset-x-6 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary"
        : "text-muted-foreground",
    );

  return (
    <nav aria-label={t("label")} className="flex">
      <Link
        href="/"
        aria-current={active === "forYou" ? "page" : undefined}
        className={tabClass(active === "forYou")}
      >
        {t("forYou")}
      </Link>
      <Link
        href={{ pathname: "/", query: { feed: "following" } }}
        aria-current={active === "following" ? "page" : undefined}
        className={tabClass(active === "following")}
      >
        {t("following")}
      </Link>
    </nav>
  );
}

function FeedTabsInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active: FeedTab =
    pathname === "/" && searchParams.get("feed") === "following"
      ? "following"
      : "forYou";

  return <TabsRow active={active} />;
}

export function FeedTabs() {
  return (
    <Suspense fallback={<TabsRow active="forYou" />}>
      <FeedTabsInner />
    </Suspense>
  );
}
