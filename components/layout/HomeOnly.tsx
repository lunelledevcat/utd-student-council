"use client";

import { usePathname } from "next/navigation";

/** Renders its (server-rendered) children on the home page only — the banner sits above the tab bar there. */
export function HomeOnly({ children }: { children: React.ReactNode }) {
  return usePathname() === "/" ? <>{children}</> : null;
}
