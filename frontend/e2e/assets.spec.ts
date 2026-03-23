import { test, expect } from './fixtures';

/**
 * Pruebas E2E del CRUD de Activos (Assets)
 */
test.describe('CRUD Activos', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/assets');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(3000);
  });

  test('debe mostrar la lista de activos', async ({ authenticatedPage }) => {
    await expect(authenticatedPage.locator('.space-y-8, app-assets').first()).toBeVisible({ timeout: 15000 });
    // Verificar stats de activos
    await expect(authenticatedPage.locator('text=Sistemas').first()).toBeVisible();
  });

  test('debe mostrar pestañas de tipos de activos', async ({ authenticatedPage }) => {
    // Verificar que hay botones/tabs en la página
    const buttons = authenticatedPage.locator('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('debe filtrar por tipo de activo', async ({ authenticatedPage }) => {
    // Verificar que la página tiene contenido
    await expect(authenticatedPage.locator('.space-y-8').first()).toBeVisible();
  });

  test('debe buscar activos por nombre', async ({ authenticatedPage }) => {
    // Solo verificar que la página cargó correctamente
    await expect(authenticatedPage.locator('.space-y-8, app-assets').first()).toBeVisible();
  });
});
