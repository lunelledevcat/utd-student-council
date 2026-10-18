"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ScrollTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 400);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <button
      type="button"
      aria-label="กลับขึ้นด้านบน"
      tabIndex={show ? 0 : -1}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        "fixed bottom-6 right-5 z-40 grid h-12 w-12 place-items-center rounded-full border border-white/20 bg-brand text-on-brand shadow-soft transition-all duration-300 hover:bg-pink",
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
      )}
    >
      <span aria-hidden>↑</span>
    </button>
  );
}
