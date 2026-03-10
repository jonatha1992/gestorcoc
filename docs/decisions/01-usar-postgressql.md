# ADR 01: Uso de PostgreSQL en Desarrollo subido a Railway

## Estado
Aceptado (Marzo 2026)

## Contexto
Durante el ciclo de desarrollo local, se requiere una base de datos liviana, portable y que no requiera configuración de infraestructura compleja (como Docker o servicios externos) para el inicio inmediato de nuevos desarrolladores o agentes de IA.

## Decisión
- Se mantiene compatibilidad con **PostgreSQL** mediante `dj-database-url` para el entorno de Staging/Producción en Railway.

## Beneficios
- Facilita el inicio rápido de nuevos desarrolladores y agentes de IA.
- No requiere configuración de infraestructura compleja.
