import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText, Zap, BadgeCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Video Speed Reader — 上傳影片，三分鐘內拿到逐字稿" },
      {
        name: "description",
        content:
          "Upload your video, get a clean transcript in three minutes. High-accuracy transcripts for content creators, educators, and engineers.",
      },
      { property: "og:title", content: "Video Speed Reader" },
      {
        property: "og:description",
        content:
          "Upload your video, get a clean transcript in three minutes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const features = [
  {
    icon: FileText,
    title: "高準確度逐字稿",
    subtitle: "High-accuracy transcripts",
    description:
      "Powered by OpenAI Whisper, with full support for Chinese and English — accurate enough to publish straight away.",
  },
  {
    icon: Zap,
    title: "三分鐘交付",
    subtitle: "Three-minute turnaround",
    description:
      "Processed in the background while you keep working. You get an email the moment your transcript is ready.",
  },
  {
    icon: BadgeCheck,
    title: "可商用授權",
    subtitle: "Commercial-use ready",
    description:
      "You own the output. Repurpose it into blog posts, course notes, or searchable archives — however you like.",
  },
];

function LandingPage() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(Boolean(data.session));
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link to="/" className="text-base font-semibold tracking-tight">
            Video Speed Reader
          </Link>
          <Link
            to={signedIn ? "/app" : "/auth"}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            {signedIn ? "Open app" : "Sign in / 登入"}
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="glow-violet">
        <div className="mx-auto max-w-3xl px-6 pb-24 pt-24 text-center sm:pt-32">
          <p className="animate-fade-up text-sm font-medium uppercase tracking-widest text-primary">
            Video Speed Reader
          </p>
          <h1 className="animate-fade-up animation-delay-150 mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            上傳影片，三分鐘內拿到逐字稿。
          </h1>
          <p className="animate-fade-up animation-delay-300 mt-6 text-lg text-muted-foreground">
            Upload your video, get a clean transcript in three minutes.
          </p>
          <div className="animate-fade-up animation-delay-450 mt-10">
            <Link
              to={signedIn ? "/app" : "/auth"}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Sign in / 登入
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="grid gap-6 sm:grid-cols-3">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="animate-fade-up rounded-2xl border border-border bg-card p-6"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="mt-5 text-lg font-semibold">{feature.title}</h2>
                <p className="mt-1 text-sm font-medium text-primary">
                  {feature.subtitle}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="mx-auto max-w-5xl px-6 py-8 text-center text-sm text-muted-foreground">
          © 2026 Video Speed Reader
        </div>
      </footer>
    </div>
  );
}
