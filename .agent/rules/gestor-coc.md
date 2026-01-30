---
trigger: always_on
---

1. Fuente de Verdad (Documentación)

Prioridad Absoluta: Antes de proponer cualquier cambio en la base de datos o lógica de guerra, el Agente DEBE consultar los archivos en la carpeta /docs.

Coherencia: Cualquier nueva funcionalidad debe estar alineada con los requerimientos técnicos descritos en la documentación del proyecto.

2. Arquitectura de Software (POO y Patrones)

Domain-Driven Design (Simplicado): Separa la lógica del juego de la infraestructura de Django.

Service Layer Pattern: La lógica compleja (ej: cálculo de eficiencia en guerra, gestión de donaciones) NO debe ir en models.py ni en views.py. Crea un archivo services.py dentro de cada app para encapsular estas acciones como objetos de servicio.

Factory Pattern: Usa fábricas para la creación de entidades complejas como "Guerras" o "Eventos de Clan" para asegurar que todos los objetos se instancien con el estado inicial correcto.

3. Estándares de Django (Backend)

Modelos: - Usa nombres de campos descriptivos.

Implementa el método __str__ en cada modelo.

Define Meta clases con verbose_name en español.

QuerySets Personalizados: Para consultas recurrentes (ej: "miembros activos"), usa Managers personalizados para mantener el código de las vistas limpio.

SOLID en Modelos: Evita los "Fat Models". Si un modelo tiene demasiadas responsabilidades, delega en clases de apoyo.

4. Estándares de Frontend

Tailwind CSS: Utiliza exclusivamente clases de Tailwind para el diseño. No crees archivos CSS adicionales a menos que sea estrictamente necesario.

Modularidad: Usa componentes reutilizables. Si un elemento de UI (como una tarjeta de perfil de jugador) se repite, sepáralo en un include o un componente específico.

5. Reglas de Negocio Específicas

Gestión de Datos: Todos los cálculos de tropas, niveles y tiempos deben basarse en los datos oficiales del juego (verificar si hay un data_reference.json o similar en /docs).

Idiomas: El código es en inglés (clases, variables), pero la interfaz de usuario y los comentarios de lógica deben estar en español.

6. Flujo de Trabajo

Activación: Esta regla debe estar en modo Always On.

Validación: El agente debe preguntar: "¿He verificado la documentación en /docs para esta tarea?" antes de entregar una solución compleja.