"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { EmptyState } from "./EmptyState";

export function FeedEmpty() {
  const t = useTranslations("empty");
  const searchParams = useSearchParams();
  const following = searchParams.get("feed") === "following";

  return following ? (
    <EmptyState
      title={t("followingTitle")}
      description={t("following")}
      actionHref="/search"
      actionLabel={t("action")}
    />
  ) : (
    <EmptyState
      title={t("forYouTitle")}
      description={t("forYou")}
      actionHref="/search"
      actionLabel={t("action")}
    />
  );
}
