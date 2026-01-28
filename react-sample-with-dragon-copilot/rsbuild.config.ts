import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

export default defineConfig({
  plugins: [pluginReact()],
  server: {
    port: 3000,
  },
  html: {
    favicon: "./public/dragon-copilot.svg",
    title: "Microsoft Dragon Copilot SDK for Javasript Sample",
    template: "./public/index.html",
  },
});
