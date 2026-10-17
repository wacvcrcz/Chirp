import { Bell, House, Search, UserRound, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  key: "home" | "search" | "alerts" | "profile";
  Icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", key: "home", Icon: House },
  { href: "/search", key: "search", Icon: Search },
  { href: "/notifications", key: "alerts", Icon: Bell },
  { href: "/profile", key: "profile", Icon: UserRound },
];
