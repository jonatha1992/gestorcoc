import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración de Playwright para pruebas E2E de GestorCOC
 *
 * Verificación de credenciales del admin:
 * - Usuario: admin
 * - Password: Temp123456! (por defecto en desarrollo)
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 1,
  workers: 2,
  reporter: [['html', { open: 'never' }], ['list']],

  timeout: 90000, // Aumentado a 90s
  expect: {
    timeout: 15000, // Aumentado a 15s
  },

  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 20000,
    navigationTimeout: 60000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm start',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 120000,
  },

  outputDir: 'test-results/',
});
