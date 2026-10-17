import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/chirp/EmptyState";

export default function SearchPage() {
  const t = useTranslations();
  return (
    <EmptyState
      title={t("nav.search")}
      description={t("placeholder.search")}
      actionHref="/"
      actionLabel={t("nav.home")}
    />
  );
}
