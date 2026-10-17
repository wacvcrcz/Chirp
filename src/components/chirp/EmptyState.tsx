import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: ReactNode;
  actionHref?: "/" | "/search";
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-start gap-2 px-6 py-12">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="max-w-[60ch] text-[15px] leading-relaxed text-muted-foreground">
        {description}
      </p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-2 inline-flex min-h-11 items-center rounded-full bg-primary px-5 font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
