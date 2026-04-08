import { test, expect } from './fixtures';

/**
 * Pruebas de Humo (Smoke Tests) - Verifican que las páginas carguen
 * 
 * Estas pruebas son más básicas y no requieren autenticación completa.
 */
test.describe('Smoke Tests - Pages Load', () => {
  test('debe cargar la página de login', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('h2:has-text("Ingresar")')).toBeVisible();
  });

  test('debe redirigir a login si no está autenticado', async ({ page }) => {
    await page.goto('/novedades');
    // Debería redirigir a login
    await page.waitForURL(/\/login/);
    await expect(page.locator('input[name="username"]')).toBeVisible();
  });

  test('debe mostrar error 404 en ruta invalida', async ({ page }) => {
    await page.goto('/ruta-invalida-que-no-existe');
    // Puede mostrar 404 o redirigir a login
    const url = page.url();
    expect(url).toMatch(/\/login|404/);
  });
});
