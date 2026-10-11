import config from "@/content/safety/config.json";
import type { AgeBand, Finding, Locale } from "../types";

// T1 classifier interface (D-022): one function, several possible implementations chosen by
// configuration. Today: `llm-json` (an instruct model with our taxonomy and a strict JSON schema,
// D-008). Later a guard model or a moderation API can be added and chained (any block wins).

export type ClassifyRequest = {
  /** "input": what the child said. "output": one sentence our model wants to say. */
  mode: "input" | "output";
  /** Always redacted text (no personal information). */
  text: string;
  ageBand: AgeBand;
  locale: Locale;
  /** For outputs: the child's last message, so the sentence is judged in context. */
  context?: string;
};

export type Classifier = {
  id: string;
  classify(req: ClassifyRequest, signal?: AbortSignal): Promise<Finding[]>;
};

/** The configured classifier, or null when none is available (no key): callers then fail closed. */
export async function configuredClassifier(): Promise<Classifier | null> {
  if (config.classifier.impl === "llm-json") {
    const { llmJsonClassifier } = await import("./llm-json");
    return llmJsonClassifier();
  }
  return null;
}
