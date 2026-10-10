"use client";

import { useLocale, useTranslations } from "next-intl";
import { SayBubble } from "@/child/ui/SayBubble";

/** A mascot line inside a server-rendered scene (client wrapper around SayBubble). */
export function SayLine({ text, audioKey, className }: { text: string; audioKey?: string; className?: string }) {
  const locale = useLocale() === "ar" ? "ar" : "en";
  const t = useTranslations("child.onb");
  return <SayBubble text={text} audioKey={audioKey} locale={locale} replayLabel={t("replay")} className={className} />;
}
