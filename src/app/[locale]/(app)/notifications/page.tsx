import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/chirp/EmptyState";

export default function NotificationsPage() {
  const t = useTranslations();
  return (
    <EmptyState
      title={t("nav.alerts")}
      description={t("placeholder.notifications")}
      actionHref="/"
      actionLabel={t("nav.home")}
    />
  );
}
