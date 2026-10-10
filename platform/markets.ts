import { z } from "zod";
import baseline from "@/content/markets/baseline.json";

// Market-specific rules live in data (SPEC §8). Adding a market = adding a reviewed JSON file
// here, never a code change elsewhere.
const marketSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(["draft", "reviewed", "live"]),
  minParentAge: z.number().int().min(18),
  ageOfDigitalConsent: z.number().int().min(13).max(18),
  consent: z.object({
    method: z.enum(["account_reauth_checkbox"]),
    policyVersion: z.string(),
    scopes: z.array(z.string()).min(1),
    reviewStatus: z.string(),
  }),
  locales: z.array(z.enum(["en", "ar"])).min(1),
  defaultLocale: z.enum(["en", "ar"]),
});

export type Market = z.infer<typeof marketSchema>;

const markets: Record<string, Market> = {
  baseline: marketSchema.parse(baseline),
};

export function getMarket(id: string): Market {
  const m = markets[id];
  if (!m) throw new Error(`Unknown market "${id}". Add content/markets/${id}.json and register it.`);
  return m;
}
