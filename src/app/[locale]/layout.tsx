import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Readex_Pro } from "next/font/google";
import { DirectionProvider } from "@/components/ui/direction";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { routing } from "@/i18n/routing";
import "@/styles/globals.css";

const readex = Readex_Pro({
  subsets: ["latin", "arabic"],
  weight: ["400", "500", "600"],
  variable: "--font-readex",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chirp",
  description: "Short posts. Global voices.",
};

// <html lang dir> needs the locale, which means awaiting params above any
// Suspense boundary. Cache Components flags that as blocking, so locale routes
// opt out of partial prerendering. Revisit with parallel routes when a route
// needs a static shell. See docs/DECISIONS.md.
export const instant = false;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      className={readex.variable}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <DirectionProvider dir={dir}>
            <NextIntlClientProvider>{children}</NextIntlClientProvider>
          </DirectionProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
