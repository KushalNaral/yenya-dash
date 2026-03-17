import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import vueJSx from "@vitejs/plugin-vue-jsx";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import Components from "unplugin-vue-components/vite";

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    vueJSx(),
    Components({
      dts: true,
      types: [
        {
          from: "vue-router",
          names: ["RouterLink", "RouterView"],
        },
        {
          from: "@iconify/vue",
          names: ["Iconify"],
        },
        {
          from: "vue3-apexcharts",
          names: ["Apexchart"],
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
