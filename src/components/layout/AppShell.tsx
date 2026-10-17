import type { ReactNode } from "react";
import { ChirpButton } from "./ChirpButton";
import { MobileHeader } from "./MobileHeader";
import { NavRail } from "./NavRail";
import { RightRail } from "./RightRail";
import { TabBar } from "./TabBar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1280px] bg-background text-foreground">
      <NavRail />
      <div className="flex min-w-0 flex-1 flex-col border-border md:max-w-[600px] md:border-x">
        <MobileHeader />
        <main className="min-w-0 flex-1 pb-24 md:pb-6">{children}</main>
      </div>
      <RightRail />
      <TabBar />
      <ChirpButton
        className="fixed end-5 bottom-20 z-30 size-14 rounded-full px-0 shadow-lg md:hidden"
        labelClassName="sr-only"
      />
    </div>
  );
}
