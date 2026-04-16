import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";

export default defineConfig({
  devToolbar: {
    enabled: false
  },
  vite: {
    plugins: [tailwindcss()],
  },

  server: {
    host: true,
    port: 25564,
    allowedHosts: ["grandparental-shasta-dourly.ngrok-free.dev"],
  },

  output: "server",
  integrations: [react()],

  adapter: vercel(),
  security: {
    checkOrigin: false,
  },
});