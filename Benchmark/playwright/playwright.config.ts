import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./src",
  timeout: 3_200_000,
  workers: 1,
  use: {
    browserName: "chromium",
    channel: "chromium",
    headless: true,
    launchOptions: {
      args: process.env["NO_GPU"] ? [] : ["--disable-software-rasterizer"],
    },
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    { name: "memory", testMatch: "memory.spec.ts" },
    { name: "performance", testMatch: "performance.spec.ts" },
    { name: "inp", testMatch: "inp.spec.ts" },
  ],
});
