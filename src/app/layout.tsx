import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { DirectionProvider } from "@/components/ui/direction";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Chirp",
  description: "Short posts. Global voices.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body>
        <DirectionProvider dir="ltr">
          <NextIntlClientProvider>{children}</NextIntlClientProvider>
          <Toaster />
        </DirectionProvider>
      </body>
    </html>
  );
}
