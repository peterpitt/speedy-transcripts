"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
    >
      Sign Out
    </button>
  );
}
