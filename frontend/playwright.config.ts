import { defineConfig } from "@playwright/test";
const porta = Number(process.env.E2E_PORT || 5174);
const endereco = `http://127.0.0.1:${porta}`;
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: endereco,
    headless: true,
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${porta} --strictPort`,
    url: endereco,
    reuseExistingServer: false,
  },
});
