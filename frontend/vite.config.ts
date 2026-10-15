import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), tailwind()],
    server: {
      host: "127.0.0.1",
      allowedHosts: ["task-tap-shopping-carlo.trycloudflare.com"],
      proxy: {
        "/api": {
          target: env.BACKEND_URL || "http://localhost:8080",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  };
});
