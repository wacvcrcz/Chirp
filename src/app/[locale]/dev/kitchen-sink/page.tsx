import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { getLocale } from "next-intl/server";
import { ChirpCard } from "@/components/chirp/ChirpCard";
import { FeedTabs } from "@/components/layout/FeedTabs";
import { ChirpButton } from "@/components/layout/ChirpButton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function KitchenSinkPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const locale = await getLocale();
  return <KitchenSink locale={locale} />;
}

const BRAND_TOKENS = [
  { name: "Canary", value: "#FFD23F", varName: "--canary", text: "ink" },
  { name: "Amber", value: "#F2A900", varName: "--amber", text: "ink" },
  { name: "Ink", value: "#14213D", varName: "--ink", text: "light" },
  { name: "Zellige", value: "#0F7B6C", varName: "--zellige", text: "light" },
  { name: "Mist", value: "#F3F5F9", varName: "--mist", text: "ink" },
  { name: "Night", value: "#0E1320", varName: "--night", text: "light" },
] as const;

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-border px-4 py-5 sm:px-5">
      <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function KitchenSink({ locale }: { locale: string }) {
  const t = useTranslations("kitchenSink");
  const tc = useTranslations("chirp");
  const tf = useTranslations("feed");

  return (
    <div className="flex flex-col">
      <div className="border-b border-border px-4 py-4 sm:px-5">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("note")}</p>
      </div>

      <Section title={t("colors")}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {BRAND_TOKENS.map((token) => (
            <div
              key={token.name}
              className="flex h-20 flex-col justify-between rounded-lg p-2.5 ring-1 ring-border"
              style={{
                backgroundColor: `var(${token.varName})`,
                color: token.text === "ink" ? "var(--ink)" : "#E8EBF4",
              }}
            >
              <span className="text-sm font-semibold">{token.name}</span>
              <bdi dir="ltr" className="nums text-xs opacity-80">
                {token.value}
              </bdi>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-muted px-2 py-1">
            muted-foreground
          </span>
          <span className="rounded-full bg-accent px-2 py-1 text-accent-foreground">
            accent
          </span>
          <span className="rounded-full bg-primary px-2 py-1 text-primary-foreground">
            primary
          </span>
          <span className="rounded-full border border-border px-2 py-1">
            border
          </span>
          <span className="text-link underline">link</span>
        </div>
      </Section>

      <Section title={t("type")}>
        <div className="flex flex-col gap-2">
          <p dir="auto" className="text-2xl font-semibold tracking-[-0.03em]">
            {t("sampleLatin")}
          </p>
          <p dir="auto" className="text-[15px] leading-relaxed">
            {t("sampleArabic")}
          </p>
          <p dir="auto" className="text-[15px] leading-relaxed">
            {t("sampleMixed")}
          </p>
          <p className="nums text-sm text-muted-foreground">
            0123456789 · 1234 · {new Intl.NumberFormat(`${locale}-u-nu-latn`).format(1234567)}
          </p>
        </div>
      </Section>

      <Section title={t("buttons")}>
        <div className="flex flex-wrap items-center gap-2">
          <Button>
            <span>{tc("action")}</span>
          </Button>
          <Button variant="outline">{tc("reply")}</Button>
          <Button variant="secondary">{tc("like")}</Button>
          <Button variant="ghost">{tc("like")}</Button>
          <Button variant="destructive">{tc("like")}</Button>
          <Button variant="link">{tc("reply")}</Button>
          <Button disabled>{tc("action")}</Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <ChirpButton />
          <ChirpButton className="px-4" labelClassName="sr-only" />
        </div>
      </Section>

      <Section title={t("tabs")}>
        <Tabs defaultValue="forYou">
          <TabsList variant="line" className="w-full">
            <TabsTrigger value="forYou" className="after:bg-primary">
              {tf("forYou")}
            </TabsTrigger>
            <TabsTrigger value="following" className="after:bg-primary">
              {tf("following")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="mt-3 rounded-lg border border-border">
          <FeedTabs />
        </div>
      </Section>

      <Section title={t("chirps")}>
        <div className="-mx-4 sm:-mx-5">
          <ChirpCard
            chirp={{
              displayName: t("samples.name1"),
              username: t("samples.handle1"),
              time: t("samples.time"),
              body: t("samples.body1"),
              replyCount: 12,
              likeCount: 348,
            }}
            replyLabel={tc("reply")}
            likeLabel={tc("like")}
          />
          <ChirpCard
            chirp={{
              displayName: t("samples.name2"),
              username: t("samples.handle2"),
              time: t("samples.time"),
              body: t("samples.body2"),
              replyCount: 3,
              likeCount: 57,
            }}
            replyLabel={tc("reply")}
            likeLabel={tc("like")}
          />
          <ChirpCard
            chirp={{
              displayName: t("samples.name3"),
              username: t("samples.handle3"),
              time: t("samples.time"),
              body: t("samples.body3"),
              replyCount: 0,
              likeCount: 9,
            }}
            replyLabel={tc("reply")}
            likeLabel={tc("like")}
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {t("motion")}: {tc("action")} · 400 ms
        </p>
      </Section>
    </div>
  );
}
