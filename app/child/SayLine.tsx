"use client";

import { useLocale, useTranslations } from "next-intl";
import { Caption } from "@/child/ui/Caption";

/** A Feelio line inside a server-rendered scene: a caption in the form of the place (redesign v2). */
export function SayLine({ text, audioKey, className, variant = "sign" }: { text: string; audioKey?: string; className?: string; variant?: "sign" | "float" | "title" }) {
  const locale = useLocale() === "ar" ? "ar" : "en";
  const t = useTranslations("child.onb");
  return <Caption text={text} audioKey={audioKey} locale={locale} replayLabel={t("replay")} variant={variant} className={className} />;
}
