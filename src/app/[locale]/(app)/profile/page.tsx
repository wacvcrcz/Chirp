import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/chirp/EmptyState";

export default function ProfilePlaceholderPage() {
  const t = useTranslations();
  return (
    <EmptyState
      title={t("nav.profile")}
      description={t("placeholder.profile")}
      actionHref="/"
      actionLabel={t("nav.home")}
    />
  );
}
