import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; user: User }
  | { status: "unauthenticated" };

/**
 * Client-side auth guard — the SPA replacement for the old TanStack
 * `_authenticated` route's `beforeLoad`. Checks the Supabase session and
 * redirects to /auth when there is no signed-in user. The resolved user is
 * exposed to the child tree via React context (useProtectedUser).
 */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (error || !data.user) {
        setState({ status: "unauthenticated" });
      } else {
        setState({ status: "authenticated", user: data.user });
      }
    });

    // Keep the guard in sync with sign-out / token refresh events.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session?.user) {
        setState({ status: "authenticated", user: session.user });
      } else {
        setState({ status: "unauthenticated" });
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (state.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (state.status === "unauthenticated") {
    return <Navigate to="/auth" replace />;
  }

  return <ProtectedUserContext.Provider value={state.user}>{children}</ProtectedUserContext.Provider>;
}

import { createContext, useContext } from "react";

const ProtectedUserContext = createContext<User | null>(null);

/** Access the authenticated user inside a ProtectedRoute subtree. */
export function useProtectedUser(): User {
  const user = useContext(ProtectedUserContext);
  if (!user) {
    throw new Error("useProtectedUser must be used within a ProtectedRoute");
  }
  return user;
}
