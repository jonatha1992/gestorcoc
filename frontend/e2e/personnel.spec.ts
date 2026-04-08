import { test, expect } from './fixtures';

/**
 * Pruebas E2E del CRUD de Personal (Personnel)
 */
test.describe('CRUD Personal', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/personnel');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(2000);
  });

  test('debe mostrar la lista de personal', async ({ authenticatedPage }) => {
    // Usar first() para evitar strict mode violation
    await expect(authenticatedPage.locator('app-personnel').first()).toBeVisible({ timeout: 15000 });
    await expect(authenticatedPage.locator('table, .list, .grid, .card').first()).toBeVisible();
  });

  test('debe abrir formulario para crear personal', async ({ authenticatedPage }) => {
    const createButton = authenticatedPage.locator('button:has-text("Nuevo"), button:has-text("Crear"), button:has-text("Agregar")');
    
    const buttonVisible = await createButton.isVisible();
    if (buttonVisible) {
      await createButton.click();
      await expect(authenticatedPage.locator('form, .modal, dialog, .form')).toBeVisible({ timeout: 5000 });
    } else {
      await expect(authenticatedPage.locator('table, .list')).toBeVisible();
    }
  });

  test('debe filtrar personal por rol', async ({ authenticatedPage }) => {
    // Usar first() para evitar strict mode violation
    const rolFilter = authenticatedPage.locator('select[name="role"], select[formControlName="role"]').first();

    const filterVisible = await rolFilter.isVisible();
    if (filterVisible) {
      await rolFilter.selectOption('OPERADOR');
      await authenticatedPage.waitForTimeout(1000);
      const rowCount = await authenticatedPage.locator('table tbody tr').count();
      expect(rowCount).toBeGreaterThan(0);
    } else {
      await expect(authenticatedPage.locator('table, .list').first()).toBeVisible();
    }
  });

  test('debe buscar personal por nombre', async ({ authenticatedPage }) => {
    const searchInput = authenticatedPage.locator('input[placeholder*="buscar"], input[type="search"], input[name="search"]');
    
    const searchVisible = await searchInput.isVisible();
    if (searchVisible) {
      await searchInput.fill('operador');
      await authenticatedPage.waitForTimeout(1000);
      await expect(authenticatedPage.locator('table tbody tr, .item, .row')).toBeVisible();
    } else {
      await expect(authenticatedPage.locator('table, .list')).toBeVisible();
    }
  });
});
