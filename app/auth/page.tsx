import type { Metadata } from "next";
import AuthForm from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "Sign in — Video Speed Reader" };

export default function AuthRoute() {
  return <AuthForm initialMode="signin" />;
}
