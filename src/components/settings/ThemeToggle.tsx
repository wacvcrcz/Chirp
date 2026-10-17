"use client";

import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type Choice = { value: "light" | "dark" | "system"; key: string; Icon: LucideIcon };

const CHOICES: Choice[] = [
  { value: "light", key: "themeLight", Icon: Sun },
  { value: "system", key: "themeSystem", Icon: Monitor },
  { value: "dark", key: "themeDark", Icon: Moon },
];

export function ThemeToggle() {
  const t = useTranslations("settings");
  // theme stays undefined through hydration, matching the server markup.
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="group"
      aria-label={t("theme")}
      className="flex w-fit gap-1 rounded-full bg-muted p-1"
    >
      {CHOICES.map(({ value, key, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={() => setTheme(value)}
            className={cn(
              "inline-flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {t(key)}
          </button>
        );
      })}
    </div>
  );
}
