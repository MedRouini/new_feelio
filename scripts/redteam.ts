// Red-team runner (SR-17, SAFETY_POLICY §9). Synthetic inputs only; no child data.
//   npm run redteam            → T0 rules only (free, deterministic; the CI gate)
//   npm run redteam -- --full  → T0 + T1 classifier on Together (uses credits; about $0.05 per run)
// Prints pass rates per kind and language, false alarms on benign look-alikes, and T1 latency.
// Writes the report to safety/tests/redteam/reports/. Exits 1 if any hard case that must pass fails.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

// Local runs read .env; CI provides its environment directly.
if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const i = line.indexOf("=");
    if (i > 0 && !(line.slice(0, i) in process.env)) process.env[line.slice(0, i)] = line.slice(i + 1);
  }
}

async function main() {
  const full = process.argv.includes("--full");
  const { buildSuite, judge, suiteVersion } = await import("../safety/tests/redteam/suite");
  const seeds = (await import("../safety/tests/redteam/seeds.json")).default;
  const { checkInput, checkInputT0 } = await import("../safety/pipeline");
  const { configuredClassifier } = await import("../safety/classify");
  const { RULES_VERSION } = await import("../safety/rules");

  const suite = buildSuite();
  const classifier = full ? await configuredClassifier() : null;
  if (full && !classifier) throw new Error("No classifier available (TOGETHER_API_KEY missing?)");

  type Row = { id: string; kind: string; lang: string; mustPass: boolean; pass: boolean; why?: string; ms: number; text: string; got: string; degraded: boolean };
  const rows: Row[] = [];
  const queue = [...suite];
  const worker = async () => {
    for (let c = queue.shift(); c; c = queue.shift()) {
      const t = performance.now();
      const ctx = { childId: null, householdId: null, ageBand: "7-9" as const, locale: (c.lang === "ar" ? "ar" : "en") as "en" | "ar", feature: "test" as const, market: "baseline" };
      const d = full ? await checkInput(ctx, c.text, classifier) : checkInputT0(c.text);
      const ms = performance.now() - t;
      const j = judge(c, d);
      rows.push({ degraded: "degraded" in d && d.degraded === true, id: c.id, kind: c.kind, lang: c.lang, mustPass: full ? c.kind === "hard" : c.t0, pass: j.pass, why: j.why, ms, text: c.text, got: `${d.action.type}${d.action.type === "crisis" ? ":" + d.action.script : ""} [${d.findings.map((f) => `${f.source}:${f.category}`).join(",")}]` });
    }
  };
  await Promise.all(Array.from({ length: full ? 3 : 1 }, worker));
  rows.sort((a, b) => a.id.localeCompare(b.id));

  const rate = (xs: Row[]) => (xs.length ? `${xs.filter((r) => r.pass).length}/${xs.length} (${((100 * xs.filter((r) => r.pass).length) / xs.length).toFixed(1)}%)` : "n/a");
  const scope = full ? rows : rows.filter((r) => r.mustPass || r.kind === "benign");
  const pct = (p: number, xs: number[]) => (xs.length ? xs.sort((a, b) => a - b)[Math.min(xs.length - 1, Math.floor((p / 100) * xs.length))].toFixed(0) : "n/a");
  const summary = {
    mode: full ? "t0+t1" : "t0",
    date: new Date().toISOString(),
    suiteVersion,
    rulesVersion: RULES_VERSION,
    classifier: classifier?.id ?? null,
    cases: rows.length,
    scored: scope.length,
    byKind: Object.fromEntries(["hard", "redirect", "steer", "benign"].map((k) => [k, rate(scope.filter((r) => r.kind === k))])),
    byLang: Object.fromEntries(["en", "ar", "arabizi"].map((l) => [l, rate(scope.filter((r) => r.lang === l))])),
    falseAlarms: scope.filter((r) => r.kind === "benign" && !r.pass).length,
    // classifier unavailable (time-out or error) after one retry: the child got the check-in line
    degraded: rows.filter((r) => r.degraded).length,
    mustPassFailures: rows.filter((r) => r.mustPass && !r.pass).length,
    latencyMs: full ? { p50: pct(50, rows.map((r) => r.ms)), p95: pct(95, rows.map((r) => r.ms)) } : null,
  };
  // Output reviewer (full run only): honest, kind sentences must pass; unsafe ones must be blocked.
  if (full) {
    const { checkOutput } = await import("../safety/pipeline");
    const outs = await Promise.all(
      seeds.outputs.map(async (o) => {
        const ctx = { childId: null, householdId: null, ageBand: "7-9" as const, locale: (o.lang === "ar" ? "ar" : "en") as "en" | "ar", feature: "test" as const, market: "baseline" };
        const r = await checkOutput(ctx, o.text, { classifier, strict: true, context: o.context });
        return { ...o, pass: (o.expect === "ok") === r.ok, got: r.ok ? "ok" : `block:${r.findings.map((f) => f.category).join(",")}` };
      }),
    );
    const bad = outs.filter((o) => !o.pass);
    Object.assign(summary, { outputs: `${outs.length - bad.length}/${outs.length}`, outputFailures: bad.length });
    summary.mustPassFailures += bad.filter((o) => o.expect === "block").length;
    for (const b of bad) console.log(`OUTPUT ${b.expect.padEnd(5)} got ${b.got.padEnd(30)} ${JSON.stringify(b.text)}`);
  }
  console.log(JSON.stringify(summary, null, 2));
  const failures = scope.filter((r) => !r.pass);
  if (failures.length) {
    console.log(`\nFailures (${failures.length}):`);
    for (const f of failures.slice(0, 80)) console.log(`${f.mustPass ? "MUST " : "     "}${f.id.padEnd(22)} ${f.why?.padEnd(24)} ${f.got.padEnd(48)} ${JSON.stringify(f.text)}`);
  }
  mkdirSync("safety/tests/redteam/reports", { recursive: true });
  writeFileSync(`safety/tests/redteam/reports/${summary.mode}-latest.json`, JSON.stringify({ summary, failures: failures.map(({ text, ...r }) => ({ ...r, text })) }, null, 2) + "\n");
  if (summary.mustPassFailures > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
