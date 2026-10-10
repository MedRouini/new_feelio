"use client";

import { useParams, usePathname } from "next/navigation";
import { LoadingScene } from "./LoadingScene";

/**
 * Route-level loading for every child screen (app/child/loading.tsx): the same scene, with the context
 * read from the address, so it continues the transition the child started.
 */
export function RouteLoading() {
  const pathname = usePathname() ?? "";
  const params = useParams<{ placeId?: string }>();
  if (/\/level\//.test(pathname)) return <LoadingScene context="level" />;
  if (params?.placeId) return <LoadingScene context="place" placeId={params.placeId} />;
  return <LoadingScene context="generic" />;
}
