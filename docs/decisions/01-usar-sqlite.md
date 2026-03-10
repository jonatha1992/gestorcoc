# ADR 01: Uso de SQLite en Desarrollo

## Estado
Aceptado (Marzo 2026)

## Contexto
Durante el ciclo de desarrollo local, se requiere una base de datos liviana, portable y que no requiera configuración de infraestructura compleja (como Docker o servicios externos) para el inicio inmediato de nuevos desarrolladores o agentes de IA.

## Decisión
Usar **SQLite** predeterminado en `DEVELOPMENT` mode.
- El archivo se ubica en `backend/db.sqlite3`.
- Se mantiene compatibilidad con **PostgreSQL** mediante `dj-database-url` para el entorno de Staging/Producción en Railway.

## Consecuencias
- **Positivas**: Setup de entorno en < 1 minuto. Fácil de resetear con `rm db.sqlite3`.
- **Negativas**: Diferencias menores en tipos de datos específicos de Postgres (ej. JSONB), aunque el ORM de Django mitiga el 95% de estos casos.
