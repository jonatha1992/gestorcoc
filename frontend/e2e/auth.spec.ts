import { test, expect, ADMIN_CREDENTIALS } from './fixtures';

/**
 * Pruebas E2E de Autenticación - Versión Simplificada
 * 
 * Estas pruebas verifican la UI de login sin depender completamente del backend.
 */
test.describe('Autenticación', () => {
  test('debe mostrar la página de login', async ({ page }) => {
    await page.goto('/login');
    
    // Verificar elementos del formulario
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('h2:has-text("Ingresar al sistema")')).toBeVisible();
    await expect(page.locator('text=Gestor COC')).toBeVisible();
  });

  test('debe mostrar toggle de contraseña', async ({ page }) => {
    await page.goto('/login');
    
    // Verificar que el botón de toggle existe
    const toggleButton = page.locator('button[type="button"][aria-label*="contrasena"]');
    await expect(toggleButton).toBeVisible();
  });

  test('debe validar campos requeridos', async ({ page }) => {
    await page.goto('/login');
    
    // Intentar enviar sin datos
    await page.click('button[type="submit"]');
    
    // El formulario debería mostrar error o no enviar
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url).toContain('/login');
  });

  test('debe mostrar error con credenciales inválidas', async ({ page }) => {
    await page.goto('/login');
    
    // Credenciales inválidas
    await page.fill('input[name="username"]', 'usuario_invalido');
    await page.fill('input[name="password"]', 'password_invalida');
    await page.click('button[type="submit"]');
    
    // Esperar mensaje de error
    await page.waitForSelector('div:has-text("invalida"), div:has-text("error"), div:has-text("acceso"), button:disabled', { timeout: 5000 });
  });

  test('debe loguearse con credenciales de admin (con backend)', async ({ page }) => {
    test.skip(!process.env['CI'], 'Solo en CI con backend disponible');
    
    await page.goto('/login');
    await page.fill('input[name="username"]', ADMIN_CREDENTIALS.username);
    await page.fill('input[name="password"]', ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    
    // Esperar navegación
    await page.waitForLoadState('networkidle');
    
    // Verificar que estamos en alguna página protegida
    const url = page.url();
    expect(url).toMatch(/\/(settings)?$|\/dashboard/);
  });
});
