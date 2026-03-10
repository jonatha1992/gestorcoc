# Documentación del Sistema GestorCOC

> Plataforma central para la gestión técnica y operativa de Centros de Operaciones y Control (COC).

---

## Índice de Documentación

1.  **[Arquitectura](./Arquitectura.md)**: Estructura técnica, stack y flujo de datos.
2.  **[Casos de Uso](./Casos_de_Uso.md)**: Actores, roles y flujos funcionales.
3.  **[Modelo de Datos](./Modelo_de_Datos.md)**: DER y diccionario de tablas.
4.  **[Manual del Backend](./Backend_Manual.md)**: Guía para desarrolladores Django.
5.  **[Manual del Frontend](./Frontend_Manual.md)**: Guía para desarrolladores Angular.
6.  **[Runbooks / Scripts](./Runbooks.md)**: Procedimientos operativos frecuentes.
7.  **[Diagramas UML](./diagrams/)**: Archivos PlantUML fuente.
8.  **[Registros de Decisiones (ADRs)](./ADRs/)**: Historia de decisiones arquitectónicas.

---

## Resumen del Sistema

GestorCOC integra la gestión de inventario CCTV con la bitácora operativa de seguridad y la cadena de custodia de evidencia digital, potenciado con capacidades de IA para el análisis de video.

### Roles Clave
- `ADMIN`: Gestión total y certificación CREV.
- `OP_EXTRACTION`: Gestión de registros y backups.
- `OP_CONTROL`: Registro de bitácora y novedades.
- `OP_VIEWER`: Consulta y dashboards.
