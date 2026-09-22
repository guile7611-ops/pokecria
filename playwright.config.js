import { defineConfig } from '@playwright/test';
const port=process.env.E2E_PORT||'4293';
export default defineConfig({
  testDir: './tests/browser', timeout: 45000, use: { baseURL: `http://127.0.0.1:${port}`, viewport: { width: 1440, height: 900 } },
  webServer: { command: 'node server.mjs', env:{PORT:port,VERDANT_TEST_MODE:'1'}, url: `http://127.0.0.1:${port}`, reuseExistingServer: false },
});
