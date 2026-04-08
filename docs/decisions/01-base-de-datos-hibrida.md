# ADR 01: Uso de Base de Datos Híbrida (SQLite/PostgreSQL)

## Estado
Actualizado (Abril 2026)

## Contexto
Durante el ciclo de desarrollo local, se requiere una base de datos liviana, portable y que no requiera configuración de infraestructura compleja (como Docker o servicios externos) para el inicio inmediato de nuevos desarrolladores o agentes de IA. Sin embargo, para producción se requiere un motor transaccional robusto y administrado.

## Decisión
- **Desarrollo (Local)**: Se adopta **SQLite** como motor por defecto. No requiere servidor adicional y los tests de ABM funcionan perfectamente sobre su estructura en memoria.
- **Producción (Railway)**: Se mantiene **PostgreSQL** administrado mediante `dj-database-url` para el entorno de Staging/Producción en Railway para alta disponibilidad.

## Beneficios
- Facilita el inicio rápido de nuevos desarrolladores y agentes de IA.
- No requiere configuración de infraestructura compleja.
