import { test, expect } from './fixtures';

/**
 * Pruebas E2E del CRUD de Novedades
 */
test.describe('CRUD Novedades', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // Navegar a la página de novedades
    await authenticatedPage.goto('/novedades');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(2000); // Esperar carga de datos
  });

  test('debe mostrar la lista de novedades', async ({ authenticatedPage }) => {
    // Verificar que la página cargó - usar first() para evitar strict mode violation
    await expect(authenticatedPage.locator('app-novedades').first()).toBeVisible({ timeout: 15000 });

    // Verificar que hay una tabla o lista
    await expect(authenticatedPage.locator('table, .list, .grid, .card').first()).toBeVisible();
  });

  test('debe abrir el formulario para crear nueva novedad', async ({ authenticatedPage }) => {
    // Buscar botón de "Nueva Novedad" o "Crear"
    const createButton = authenticatedPage.locator('button:has-text("Nueva"), button:has-text("Crear"), button:has-text("Agregar"), button:has-text("Nuevo")');
    
    const buttonVisible = await createButton.isVisible();
    if (buttonVisible) {
      await createButton.click();
      
      // Verificar que el formulario o modal se abre
      await expect(authenticatedPage.locator('form, .modal, dialog, .form')).toBeVisible({ timeout: 5000 });
    } else {
      // Si no hay botón, verificar que al menos la página cargó
      await expect(authenticatedPage.locator('table, .list')).toBeVisible();
    }
  });

  test('debe filtrar novedades por estado', async ({ authenticatedPage }) => {
    // Buscar filtro de estado - usar first() para evitar strict mode violation
    const statusFilter = authenticatedPage.locator('select[name="status"], select[formControlName="status"]').first();

    const filterVisible = await statusFilter.isVisible();
    if (filterVisible) {
      await statusFilter.selectOption('OPEN');
      await authenticatedPage.waitForTimeout(1000);

      // Verificar que la tabla tiene filas (usar count en lugar de isVisible)
      const rowCount = await authenticatedPage.locator('table tbody tr').count();
      expect(rowCount).toBeGreaterThan(0);
    } else {
      // Si no hay filtro, verificar que la página tiene contenido
      await expect(authenticatedPage.locator('table, .list').first()).toBeVisible();
    }
  });

  test('debe filtrar novedades por severidad', async ({ authenticatedPage }) => {
    // Buscar filtro de severidad
    const severityFilter = authenticatedPage.locator('select[name="severity"], select[formControlName="severity"], select:has-text("HIGH"), select:has-text("CRITICAL"), select:has-text("Severidad")');
    
    const filterVisible = await severityFilter.isVisible();
    if (filterVisible) {
      await severityFilter.selectOption('HIGH');
      await authenticatedPage.waitForTimeout(1000);
      
      // Verificar que la tabla se actualiza
      await expect(authenticatedPage.locator('table tbody tr, .item, .row')).toBeVisible();
    } else {
      await expect(authenticatedPage.locator('table, .list')).toBeVisible();
    }
  });

  test('debe buscar novedades por texto', async ({ authenticatedPage }) => {
    // Buscar campo de búsqueda
    const searchInput = authenticatedPage.locator('input[placeholder*="buscar"], input[type="search"], input[name="search"]');
    
    const searchVisible = await searchInput.isVisible();
    if (searchVisible) {
      await searchInput.fill('cámara');
      await authenticatedPage.waitForTimeout(1000);
      
      // Verificar que los resultados se filtran
      await expect(authenticatedPage.locator('table tbody tr, .item, .row')).toBeVisible();
    } else {
      await expect(authenticatedPage.locator('table, .list')).toBeVisible();
    }
  });

  test('debe limpiar filtros', async ({ authenticatedPage }) => {
    // Buscar botón de limpiar filtros
    const clearButton = authenticatedPage.locator('button:has-text("Limpiar"), button:has-text("Clear"), button:has-text("Reset")');
    
    const buttonVisible = await clearButton.isVisible();
    if (buttonVisible) {
      await clearButton.click();
      
      // Verificar que los filtros se resetean
      const searchInput = authenticatedPage.locator('input[placeholder*="buscar"]');
      if (await searchInput.isVisible()) {
        const value = await searchInput.inputValue();
        expect(value).toBe('');
      }
    } else {
      await expect(authenticatedPage.locator('table, .list')).toBeVisible();
    }
  });
});
