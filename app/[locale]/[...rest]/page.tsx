import { notFound } from "next/navigation";

// Any unknown path under a locale renders app/[locale]/not-found.tsx.
export default function CatchAll() {
  notFound();
}
