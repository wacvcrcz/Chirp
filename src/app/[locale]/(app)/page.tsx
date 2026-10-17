import { Suspense } from "react";
import { FeedTabs } from "@/components/layout/FeedTabs";
import { FeedEmpty } from "@/components/chirp/FeedEmpty";

export default function HomePage() {
  return (
    <>
      <div className="sticky top-0 z-20 hidden border-b border-border bg-background/95 backdrop-blur md:block">
        <FeedTabs />
      </div>
      <Suspense fallback={<div className="h-40" />}>
        <FeedEmpty />
      </Suspense>
    </>
  );
}
