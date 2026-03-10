---
name: test_flow
description: Ejecuta la suite completa de pruebas del sistema (Backend y Frontend).
---

# Skill: Test Flow

Este comando automatiza la ejecución de pruebas para asegurar la integridad del código.

## Pasos

1. **Pruebas de Backend**:
   ```bash
   cd backend
   .\.venv\Scripts\python.exe manage.py test records
   ```

2. **Pruebas de Frontend**:
   ```bash
   cd frontend
   npm test
   ```

## Recomendaciones
- Ejecutar antes de cada Commit importante.
- Si fallan las pruebas de `records`, revisar el mock de la IA en `records/tests/`.
