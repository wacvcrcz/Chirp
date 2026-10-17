"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { ChirpButton } from "./ChirpButton";
import { NAV_ITEMS } from "./nav-items";
import { cn } from "@/lib/utils";

export function NavRail() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-20 shrink-0 flex-col justify-between px-2 py-4 md:flex xl:w-64 xl:pe-6">
      <div className="flex flex-col gap-1">
        <Link
          href="/"
          aria-label={t("home")}
          className="mb-3 flex min-h-11 items-center justify-center rounded-full px-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 xl:justify-start"
        >
          <span aria-hidden="true" className="xl:hidden">
            <LogoMark size={32} />
          </span>
          <span className="hidden xl:inline-flex">
            <Logo size={32} />
          </span>
        </Link>

        <nav aria-label={t("label")} className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, key, Icon }) => {
            const active =
              pathname === href ||
              (href !== "/" && pathname.startsWith(`${href}/`));

            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-full px-3 py-2 text-[17px] transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 xl:px-4",
                  active ? "font-semibold" : "text-muted-foreground",
                )}
              >
                <Icon className="size-6 shrink-0" aria-hidden="true" />
                <span className="hidden xl:inline">{t(key)}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <ChirpButton
        className="md:size-14 md:px-0 xl:h-12 xl:w-full xl:px-5"
        labelClassName="hidden xl:inline"
      />
    </aside>
  );
}
