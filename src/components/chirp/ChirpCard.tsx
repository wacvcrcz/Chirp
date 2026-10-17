import type { ReactNode } from "react";
import { MessageCircle, Heart } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChirpText } from "./ChirpText";

export type ChirpCardData = {
  displayName: string;
  username: string;
  time: string;
  body: string;
  replyCount: number;
  likeCount: number;
};

function Action({
  icon,
  label,
  count,
}: {
  icon: ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="inline-flex min-h-11 min-w-11 items-center gap-1.5 rounded-full text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {icon}
      <span className="nums">{count === 0 ? "" : count}</span>
    </button>
  );
}

export function ChirpCard({
  chirp,
  replyLabel,
  likeLabel,
}: {
  chirp: ChirpCardData;
  replyLabel: string;
  likeLabel: string;
}) {
  const initial = Array.from(chirp.displayName)[0] ?? "?";

  return (
    <article className="flex gap-3 border-b border-border px-4 py-3.5 sm:px-5">
      <Avatar className="size-11 shrink-0" aria-hidden="true">
        <AvatarFallback>{initial}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <header className="flex flex-wrap items-baseline gap-x-1.5">
          <span dir="auto" className="font-semibold">
            {chirp.displayName}
          </span>
          <bdi dir="ltr" className="text-sm text-muted-foreground">
            @{chirp.username}
          </bdi>
          <span aria-hidden="true" className="text-sm text-muted-foreground">
            ·
          </span>
          <span className="nums text-sm text-muted-foreground">
            {chirp.time}
          </span>
        </header>
        <ChirpText body={chirp.body} />
        <div className="mt-2 flex items-center gap-4">
          <Action
            icon={<MessageCircle className="size-4" aria-hidden="true" />}
            label={replyLabel}
            count={chirp.replyCount}
          />
          <Action
            icon={<Heart className="size-4" aria-hidden="true" />}
            label={likeLabel}
            count={chirp.likeCount}
          />
        </div>
      </div>
    </article>
  );
}
