"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// The webhook credits asynchronously; refresh once shortly after landing here
// so the balance shown reflects the just-completed purchase.
export default function AutoRefresh({ delayMs = 2000 }: { delayMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setTimeout(() => router.refresh(), delayMs);
    return () => clearTimeout(t);
  }, [router, delayMs]);
  return null;
}
