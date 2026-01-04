import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

const buildTime = new Date().toISOString();

export default defineConfig({
  plugins: [
    vue(),
    {
      name: "inject-build-time",
      transformIndexHtml(html) {
        return html.replace("%BUILD_TIME%", buildTime);
      },
    },
  ],
  base: "/",
});
