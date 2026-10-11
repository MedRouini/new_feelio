"use client";

import { useEffect, useRef } from "react";

/**
 * A hidden form field holding the browser's IANA time zone (e.g. "Asia/Dubai"), so the family's day and
 * allowed hours follow their local clock (D-065). The server validates it with Luxon and falls back to
 * UTC; the parent can change it later in the account page.
 */
export function BrowserTimezone({ name = "timezone" }: { name?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    try {
      const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (zone && ref.current) ref.current.value = zone;
    } catch {
      // keep UTC
    }
  }, []);
  return <input ref={ref} type="hidden" name={name} defaultValue="UTC" />;
}
