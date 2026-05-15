# ADR 01: PostgreSQL como base de datos unica

## Estado
Actualizado (Mayo 2026)

## Contexto
GestorCOC ya cuenta con una base de datos PostgreSQL administrada en Railway y el proyecto requiere evitar divergencias entre datos locales, archivos SQLite versionados y el entorno productivo.

## Decision
- **Desarrollo, tests y produccion** usan PostgreSQL mediante la variable `DATABASE_URL`.
- SQLite no se usa como motor de respaldo ni como archivo versionado del proyecto.
- Si `DATABASE_URL` no esta configurada, Django falla al iniciar para evitar escribir datos en una base incorrecta.

## Consecuencias
- El entorno local debe definir `DATABASE_URL` apuntando a PostgreSQL.
- Railway debe tener `DATABASE_URL` configurada con la base administrada.
- Se elimina el riesgo de operar accidentalmente sobre `backend/db.sqlite3`.
