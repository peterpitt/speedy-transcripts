"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function UploadForm() {
  const router = useRouter();
  const [videoUrl, setVideoUrl] = useState("");
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState("zh");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_source_url: videoUrl,
          topic: topic || undefined,
          language,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }
      setVideoUrl("");
      setTopic("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="animate-fade-up rounded-2xl border border-border bg-card p-6"
    >
      <h2 className="text-lg font-semibold">Transcribe a video</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Paste a direct media URL and we&apos;ll return a clean transcript.
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <label htmlFor="videoUrl" className="text-sm font-medium">
            Video URL
          </label>
          <input
            id="videoUrl"
            type="url"
            required
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="Direct mp4 / mp3 URL (e.g. CloudFront, Vimeo, Internet Archive)"
            className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            YouTube URLs are not supported in M1 (cloud IPs get bot-checked).
          </p>
        </div>

        <div>
          <label htmlFor="topic" className="text-sm font-medium">
            Topic <span className="text-muted-foreground">(optional)</span>
          </label>
          <input
            id="topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Tech podcast — useful context for the model"
            className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
          />
        </div>

        <div>
          <label htmlFor="language" className="text-sm font-medium">
            Language
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
          >
            <option value="zh">中文 (zh)</option>
            <option value="en">English (en)</option>
            <option value="ja">日本語 (ja)</option>
          </select>
        </div>

        {error && (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Submitting…" : "Transcribe"}
        </button>
      </div>
    </form>
  );
}
