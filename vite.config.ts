import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path";

const host = process.env.TAURI_DEV_HOST;
const mockTauri = process.env.MOCK_TAURI === "true";

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [svelte()],

  // Vitest configuration
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.ts"],
    // Force browser conditions to use Svelte's client-side bundle
    server: {
      deps: {
        inline: [/svelte/],
      },
    },
  },

  // Resolve configuration for proper Svelte 5 support in tests
  resolve: {
    conditions: ["browser", "development"],
    ...(mockTauri && {
      alias: {
        "@tauri-apps/api/core": path.resolve("src/lib/mock-tauri.ts"),
        "@tauri-apps/plugin-store": path.resolve("src/lib/mock-tauri.ts"),
        "@tauri-apps/api/window": path.resolve("src/lib/mock-tauri.ts"),
        "@tauri-apps/plugin-dialog": path.resolve("src/lib/mock-tauri.ts"),
        "@tauri-apps/plugin-fs": path.resolve("src/lib/mock-tauri.ts"),
      },
    }),
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
