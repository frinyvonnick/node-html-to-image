import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    clearMocks: true,
    // The integration suite launches a real Chromium and runs Tesseract OCR,
    // so it needs a generous timeout and a couple of retries.
    testTimeout: 1000 * 60,
    retry: 2,
  },
});
