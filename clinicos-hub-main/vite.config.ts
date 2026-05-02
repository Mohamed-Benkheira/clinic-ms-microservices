// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    server: {
      proxy: {
        "/api/auth": { target: "http://localhost:8001", changeOrigin: true },
        "/api/patients": { target: "http://localhost:8002", changeOrigin: true },
        "/api/doctors": { target: "http://localhost:8003", changeOrigin: true },
        "/api/appointments": { target: "http://localhost:8004", changeOrigin: true },
      },
    },
  },
});
