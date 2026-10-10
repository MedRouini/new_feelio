import { getTranslations } from "next-intl/server";
import { GrownUpDoor } from "@/child/ui/GrownUpDoor";
import { env } from "@/platform/env";
import { ServiceWorker } from "./ServiceWorker";

// Shell for every child screen: the grown-up door (press and hold) in the corner, and the offline
// service worker. Each page renders its own scene.
export default async function ChildLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("child.grownup");
  return (
    <>
      {children}
      <GrownUpDoor href={`${env().DASHBOARD_ORIGIN}/`} label={t("door")} />
      <ServiceWorker />
    </>
  );
}
