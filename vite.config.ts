import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Plain Vite + React single-page app.
// `vite build` emits a static bundle to dist/ that can be hosted anywhere
// (Vercel static hosting). Client-side routing is handled by React Router;
// the SPA fallback for deep links lives in vercel.json.
export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  server: {
    host: true,
    port: 8080,
  },
  build: {
    outDir: "dist",
  },
});
