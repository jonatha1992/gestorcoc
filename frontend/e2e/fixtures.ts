import { test as base, expect, Page } from '@playwright/test';

/**
 * Fixtures para pruebas E2E de GestorCOC
 * Incluye autenticación completa con JWT
 */

// Credenciales del admin por defecto (seed_system_users)
export const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: process.env['SYSTEM_USERS_DEFAULT_PASSWORD'] || 'Temp123456!',
};

// Fixture base con autenticación
export const test = base.extend<{
  loginPage: LoginPage;
  authenticatedPage: Page;
  adminPage: Page;
}>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },
  
  authenticatedPage: async ({ page }, use) => {
    // Login antes de cada prueba
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(ADMIN_CREDENTIALS.username, ADMIN_CREDENTIALS.password);
    
    // Esperar a que la autenticación se complete y haya navegación
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Esperar procesamiento de JWT y redirect
    
    // Verificar que no estamos en login (redireccionó correctamente)
    const url = page.url();
    if (url.includes('/login')) {
      console.error('No se pudo autenticar. URL actual:', url);
      throw new Error('No se pudo autenticar. Verificar backend y credenciales.');
    }
    
    await use(page);
  },
  
  adminPage: async ({ page }, use) => {
    // Login específico para admin
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(ADMIN_CREDENTIALS.username, ADMIN_CREDENTIALS.password);
    
    // Esperar autenticación
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    await use(page);
  },
});

export { expect } from '@playwright/test';

/**
 * Page Object para la página de Login
 */
export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
    await this.page.waitForSelector('input[name="username"]', { state: 'visible' });
  }

  async login(username: string, password: string) {
    await this.page.fill('input[name="username"]', username);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]');
  }

  async getErrorMessage() {
    const errorDiv = this.page.locator('div:has-text("invalida"), div:has-text("error"), div:has-text("acceso")');
    return await errorDiv.first().textContent();
  }
}
