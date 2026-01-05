# Documentación Técnica CREV 2.0 - Ingeniería de Requisitos

## 1. Introducción y Alcance
El sistema centraliza la gestión técnica de cámaras y el flujo administrativo de expedientes.

### 1.1 Glosario Técnico
*   **DTL**: Django Template Language.
*   **ORM**: Object-Relational Mapping (Abstracción de Base de Datos).
*   **KPI**: Key Performance Indicator (Indicadores de desempeño).
*   **Mesa de Entrada**: Módulo de gestión documental.
*   **Novedad Técnica**: Registro de falla o cambio en equipamiento.

---

## 2. Ingeniería de Requisitos

### 2.1 Requisitos de Usuario (UR) - "Lo que el humano necesita"
1.  **UR-01**: El usuario debe poder ver en un solo vistazo si hay cámaras críticas caídas.
2.  **UR-02**: El personal técnico necesita que el sistema le avise si un expediente lleva más de 48hs sin gestión.
3.  **UR-03**: Se requiere que la carga de fallas de cámara sea posible desde un dispositivo móvil con interfaz táctil.

### 2.2 Requisitos Funcionales del Sistema (SR) - "Lo que el software hace"

#### Módulo de Dashboards (Inteligencia de Negocio)
*   **SR-DASH-01**: Existirá un **Dashboard Maestro** genérico con el resumen de todos los módulos.
*   **SR-DASH-02**: El **Módulo de Hechos/Cámaras** tendrá su propio Dashboard detallado (Fallas por zona, Top cámaras fallidas).
*   **SR-DASH-03**: El **Módulo de Mesa de Entrada** tendrá un Dashboard de gestión (Productividad, Tiempos de respuesta).

#### Módulo de Novedades y Cámaras
*   **SR-CAM-01**: Al dar de alta una novedad técnica, se debe poder filtrar la cámara por nombre o IP.
*   **SR-CAM-02**: El sistema debe permitir adjuntar múltiples fotos de la falla técnica.

---

## 3. Matriz de Trazabilidad
| Requerimiento Usuario | Implementación Técnica | Validación |
| :--- | :--- | :--- |
| UR-01 | Dashboard Maestro (SR-DASH-01) | Test Visual |
| UR-02 | Alarmas de Expediente (SR-DOC-05) | Verificación Horaria |
| UR-03 | Tailwind Responsive (RNF-UI-01) | Test Mobile |

---

## 4. Trazabilidad de Base de Datos (Scalability)
El diseño respeta el estándar agnóstico de Django ORM. Aunque se use **SQLite** inicialmente, la estructura es 100% compatible con **PostgreSQL** para el crecimiento futuro del volumen de datos.

---

## 5. Próximos Pasos Técnicos
1.  Setup de Proyecto Django.
2.  Creación de Apps: `core`, `inventory`, `documents`, `stats`.
3.  Implementación de Base Templates con Sidebar y Estética Glass.
