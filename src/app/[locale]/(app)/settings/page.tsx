import { useTranslations } from "next-intl";
import { LanguageToggle } from "@/components/settings/LanguageToggle";
import { ThemeToggle } from "@/components/settings/ThemeToggle";

export default function SettingsPage() {
  const t = useTranslations("settings");

  return (
    <div className="flex flex-col gap-6 px-4 py-5 sm:px-5">
      <h1 className="text-xl font-semibold">{t("title")}</h1>

      <section className="flex flex-col gap-2">
        <h2 className="text-[15px] font-semibold">{t("theme")}</h2>
        <ThemeToggle />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[15px] font-semibold">{t("language")}</h2>
        <LanguageToggle />
      </section>

      <p className="border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground">
        {t("placeholder")}
      </p>
    </div>
  );
}
