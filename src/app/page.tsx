import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("home");

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-3 px-6">
      <h1 className="text-3xl font-semibold tracking-[-0.03em]">Chirp</h1>
      <p className="text-muted-foreground">{t("tagline")}</p>
      <p className="text-sm text-muted-foreground">
        Phase 0 scaffold. The app shell lands in Phase 1.
      </p>
    </main>
  );
}
