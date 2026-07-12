"use client";

import Lenis from "@studio-freight/lenis";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function LenisProvider() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/dashboard")) return;

    const lenis = new Lenis();

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, [pathname]);

  return null;
}

