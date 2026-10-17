import { useTranslations } from "next-intl";
import { SearchBox } from "./SearchBox";

export function RightRail() {
  const t = useTranslations("rail");

  return (
    <aside className="sticky top-0 hidden h-dvh w-80 shrink-0 flex-col gap-4 overflow-y-auto py-4 ps-6 lg:flex xl:w-96">
      <SearchBox />

      <section className="rounded-2xl bg-card p-4 ring-1 ring-border">
        <h2 className="text-lg font-semibold">{t("whoToFollow")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("whoToFollowEmpty")}
        </p>
      </section>

      <section className="rounded-2xl bg-card p-4 ring-1 ring-border">
        <h2 className="text-lg font-semibold">{t("topics")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("topicsEmpty")}
        </p>
      </section>
    </aside>
  );
}
