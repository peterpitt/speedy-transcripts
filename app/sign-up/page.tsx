import type { Metadata } from "next";
import AuthForm from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "Sign up — Video Speed Reader" };

export default function SignUpRoute() {
  return <AuthForm initialMode="signup" />;
}
