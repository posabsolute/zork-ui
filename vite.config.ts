import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  server: { port: 5173, open: false },
  build: { target: "es2022", assetsInlineLimit: 0 },
  // ifvms ships a self-contained UMD bundle; pre-bundle it. glkapi.js is loaded
  // as a classic script (sloppy mode), not imported, so it's not listed here.
  optimizeDeps: { include: ["ifvms/dist/zvm.js"] },
});
