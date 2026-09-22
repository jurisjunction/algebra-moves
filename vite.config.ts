/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // mathjs + KaTeX make a single ~1 MB chunk; fine for this app.
  build: { chunkSizeWarningLimit: 1500 },
  test: {
    environment: "node",
  },
});
