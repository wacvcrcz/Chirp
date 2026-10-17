"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";

export function SearchBox() {
  const t = useTranslations("search");
  const router = useRouter();

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const q = String(data.get("q") ?? "").trim();
        router.push({ pathname: "/search", query: q ? { q } : {} });
      }}
      className="flex flex-col gap-1.5"
    >
      <label
        htmlFor="rail-search"
        className="text-sm font-semibold text-muted-foreground"
      >
        {t("label")}
      </label>
      <Input
        id="rail-search"
        name="q"
        type="search"
        placeholder={t("placeholder")}
        className="h-11 rounded-full bg-muted px-4"
      />
    </form>
  );
}
