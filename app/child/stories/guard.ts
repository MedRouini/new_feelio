import "server-only";
import { redirect } from "next/navigation";
import { getChild } from "@/auth/guards";
import { getChildView } from "@/child/view";

/** Stories pages: a child device, onboarding done, and Stories allowed by the parent (server-side, CR-2). */
export async function storiesChild() {
  const child = await getChild();
  if (!child) redirect("/");
  const view = await getChildView(child);
  if (!view?.onboarding.done) redirect("/");
  if (!view.features.stories) redirect("/");
  return { child, view };
}
