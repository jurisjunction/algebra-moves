/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Relative asset paths, so the same build works at a GitHub Pages subpath (/algebra-moves/).
  base: "./",
  // mathjs + KaTeX make a single ~1 MB chunk; fine for this app.
  build: { chunkSizeWarningLimit: 1500 },
  // Allow GitHub Codespaces / other forwarded hosts to reach the dev server.
  server: { host: true, allowedHosts: [".app.github.dev", ".githubpreview.dev"] },
  preview: { host: true, allowedHosts: [".app.github.dev", ".githubpreview.dev"] },
  test: {
    environment: "node",
  },
});
