import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/auth/SignOutButton";

export const metadata: Metadata = { title: "Dashboard — Video Speed Reader" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="text-base font-semibold tracking-tight">
            Video Speed Reader
          </Link>
          <SignOutButton />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-20">
        <div className="animate-fade-up">
          <h1 className="text-3xl font-bold tracking-tight">Hi {user.email}</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Your dashboard is coming soon. Upload functionality will be added in
            the next milestone.
          </p>
        </div>
      </main>
    </div>
  );
}
