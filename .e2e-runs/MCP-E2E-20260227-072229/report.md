# E2E Report - MCP Playwright

- Run ID: `MCP-E2E-20260227-072229`
- Fecha: `2026-02-27`
- Entorno: Frontend `http://localhost:4200`, Backend `http://localhost:8000`
- Viewports: Desktop `1440x900`, Mobile spot-check `390x844`

## Cobertura ejecutada

1. Navegación por páginas principales desde sidebar.
2. CRUD en `assets` (System/Server/Camera/Gear; edición de Gear).
3. CRUD en `personnel` (alta, edición rank, toggle activo).
4. Alta en `records`.
5. CRUD en `novedades`.
6. CRUD en `hechos`.
7. Flujo `integrity` con carga de `README.md` y limpieza.
8. Wizard de `informes` con validaciones, IA y generación DOC local.
9. Validación de comportamiento de `/settings`.

## Hallazgos

1. **Alta** - `/settings` inconsistente / roto funcionalmente.
- Ruta: `Configuración` desde sidebar.
- Repro: click en `Configuración`.
- Resultado: estado visual inconsistente (sidebar/cabecera de configuración con contenido de dashboard; URL observada sin ruta real estable).
- Impacto: navegación confusa y potencial error de routing.
- Evidencia: `e2e-03-settings-link-behavior.png`.

2. **Media** - errores de consola `NG0100 ExpressionChangedAfterItHasBeenCheckedError` en múltiples módulos.
- Rutas/componentes observados: `assets`, `novedades`, `informes`.
- Impacto: inestabilidad de estado en detección de cambios; riesgo de regresiones UI.
- Evidencia: logs de consola de la sesión Playwright.

3. **Media** - botones de IA/generación en `informes` quedan en estado de carga tras éxito.
- Repro: ejecutar mejoras IA y generación.
- Resultado: toasts de éxito y DOC generado, pero labels de botón permanecen como `Mejorando...` / `Generando...` en ocasiones.
- Impacto: feedback de UX incorrecto.

4. **Media** - layout mobile con problemas de usabilidad.
- Repro: viewport `390x844`.
- Resultado: sidebar/área principal con clipping y scrolls incómodos.
- Evidencia: `e2e-04-mobile-dashboard-check.png`, `e2e-05-assets-post-cleanup.png`.

## Salud de red/API

- No se observaron respuestas `5xx` en los endpoints ejercitados durante la corrida.
- Operaciones CRUD ejecutadas con respuestas esperadas (`200/201/204`).

## Cleanup

Eliminaciones confirmadas por API:
- `film-record:141`
- `person:186`
- `camera:1971`
- `server:155`
- `system:43`
- `gear:25`

Validación final: sin remanentes del prefijo `MCP-E2E-20260227-072229`.

## Artefactos

- `e2e-01-dashboard-baseline.png`
- `e2e-02-assets-after-crud.png`
- `e2e-03-settings-link-behavior.png`
- `e2e-04-mobile-dashboard-check.png`
- `e2e-05-assets-post-cleanup.png`
- `e2e-06-desktop-assets-post-cleanup.png`
- `informe-analisis-video-2026-02-27-local.doc`
