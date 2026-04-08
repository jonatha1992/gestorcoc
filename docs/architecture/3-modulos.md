# Módulos del Sistema — GestorCOC

> Descripción técnica de cada app Django, módulos Angular, casos de uso principales y diccionario de datos.

---

## 1. Apps del Backend (Django)

| App | Responsabilidad |
|-----|----------------|
| `assets` | Inventario de activos: Unidades, Sistemas CCTV, Servidores, Cámaras y Equipamiento (`Gear`). |
| `novedades` | Reporte y gestión del ciclo de vida de fallas técnicas sobre activos. |
| `hechos` | Bitácora operativa en tiempo real: eventos policiales, operativos e informativos. |
| `personnel` | Gestión de personas (internas/externas), usuarios Django, roles y permisos RBAC. |
| `records` | Registros fílmicos (cadena de custodia), integridad de archivos, informes con IA y partes diarios. |

### Servicios clave (`services.py`)

La lógica de negocio compleja reside en la capa de servicios, nunca en vistas ni modelos:

- **`records/services.py` → `IntegrityService`**: Calcula hashes (SHA-1/256/512), genera informes DOCX/PDF, gestiona la integración con múltiples proveedores de IA con fallback automático.
- **`personnel/access.py`**: Define roles (`GROUP_PERMISSION_MAP`) y códigos de permisos (`PermissionCode`).

---

## 2. Módulos del Frontend (Angular)

| Ruta | Permisos requeridos | Función |
|------|--------------------|---------| 
| `/login` | Público | Autenticación JWT |
| `/` | `view_dashboard` | Dashboard con KPIs y mapa de unidades |
| `/assets` | `view_assets` | Inventario CCTV y equipamiento |
| `/novedades` | `view_novedades` | Gestión de novedades de equipos |
| `/hechos` | `view_hechos` | Bitácora de hechos operativos |
| `/personnel` | `view_personnel` | Gestión de personal y usuarios |
| `/records` | `view_records` | Registros fílmicos y partes diarios |
| `/integrity` | `use_integrity_tools` | Herramientas de verificación de hash |
| `/informes` | `manage_records` | Generación de informes con IA |
| `/settings` | `view_settings` | Perfil de usuario y cambio de contraseña |

---

## 3. Casos de Uso Principales

### UC-01: Reportar Novedad de Equipo
- **Actores**: `ADMIN`, `COORDINADOR_COC`, `OPERADOR`
- **Flujo**: El operador registra una falla sobre un activo → sistema asigna estado `OPEN` → pasa por `IN_PROGRESS` → cierra con `CLOSED`.

### UC-02: Registrar Hecho Operativo (Bitácora)
- **Actores**: `ADMIN`, `COORDINADOR_COC`, `OPERADOR`
- **Flujo**: El operador documenta un evento en tiempo real con categoría (`POLICIAL`, `OPERATIVO`, `INFORMATIVO`, `RELEVAMIENTO`) y puede vincularlo a una cámara específica.

### UC-03: Gestión de Registros Fílmicos (Cadena de Custodia)
- **Actores**: `ADMIN`, `CREV`, `COORDINADOR_CREV`, `OPERADOR`
- **Flujo**: Creación del registro → carga de hash del archivo → verificación CREV (bloquea edición) → generación de certificado PDF.

### UC-04: Verificación de Integridad de Evidencia
- **Actores**: `ADMIN`, `CREV`, `COORDINADOR_CREV`
- **Flujo**: El usuario carga el archivo localmente → `crypto-js` calcula el hash en el navegador → se compara contra el hash guardado en BD. Sin subir el archivo al servidor.

### UC-05: Generación de Informes con IA
- **Actores**: `ADMIN`, `CREV`, `COORDINADOR_CREV`, `OPERADOR`
- **Flujo**: El usuario selecciona un registro → el backend llama al proveedor de IA activo → se genera un documento DOCX con la narrativa del análisis de video.

### UC-06: Dashboard Operacional
- **Actores**: Todos los roles
- **Flujo**: Visualización de KPIs en tiempo real (novedades activas, registros pendientes, etc.) y mapa geográfico de unidades aeroportuarias.

---

## 4. Modelo de Datos — Entidades Clave

> Diagramas completos: [`modelo_datos.puml`](../diagrams/modelo_datos.puml) | [`jerarquia_activos.puml`](../diagrams/jerarquia_activos.puml)
>
> Todos los modelos heredan de `TimeStampedModel` (`created_at`, `updated_at`).

### `Unit` — Unidades / Aeropuertos
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `code` | CharField | ID único de la unidad (ej: `AEP`, `EZE`) |
| `parent` | FK(self) | Relación jerárquica con unidad superior |
| `map_enabled` | Boolean | Habilita visibilidad en el mapa del dashboard |

### `Person` — Personal
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `badge_number` | CharField | Legajo de 6 dígitos (único) |
| `user` | OneToOne(User) | Vínculo opcional con usuario Django |
| `rank` | CharField | Jerarquía (`OFICIAL`, `INSPECTOR`, `CIVIL`, etc.) |

### `FilmRecord` — Registro Fílmico
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `judicial_case_number` | CharField | Indexado para búsqueda rápida |
| `file_hash` | CharField | Huella SHA-1/256/512 del archivo de video |
| `delivery_status` | CharField | `PENDIENTE`, `ENTREGADO`, `DERIVADO`, `FINALIZADO`, `ANULADO` |
| `is_editable` | Boolean | Se bloquea en `False` tras verificación CREV |

### `Hecho` — Bitácora Operativa
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `category` | CharField | `POLICIAL`, `OPERATIVO`, `INFORMATIVO`, `RELEVAMIENTO` |
| `camera` | FK(Camera) | Vínculo opcional a la cámara del hecho |

### `AIUsageLog` — Trazabilidad de IA
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `provider` | CharField | `GEMINI`, `GROQ`, `OPENROUTER`, `OLLAMA` |
| `tokens_used` | IntegerField | Consumo por llamada para auditoría de costos |

---

## 5. Integraciones de IA

El backend soporta múltiples proveedores con **fallback automático** en caso de error:

```
Gemini (primario) → Groq → OpenRouter → Ollama (local)
```

La gestión se realiza desde `records/services.py`. Las claves se configuran en `backend/.env`.

---

*Última actualización: marzo 2026*
