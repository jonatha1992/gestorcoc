# Manual del Frontend - GestorCOC

## Tecnologías
- **Angular 21 (v21.1.0)**: SPA moderna.
- **Tailwind CSS v4**: Framework de estilos atómico.
- **ApexCharts**: Visualizaciones y gráficas en Dashboard.
- **Crypto-JS**: Cálculo de hash local en el navegador.

## Características Principales
- **Componentes Standalone**: Arquitectura modular sin NgModules.
- **Cálculo Local de Hash**: Permite verificar integridad sin subir archivos pesados al servidor, ahorrando ancho de banda.
- **CacheService**: Implementa TTLs para optimizar peticiones a la API.
- **Responsive Design**: Diseño adaptado para monitores de COC y tablets.

## Desarrollo
1.  `npm install`
2.  `npm start` (abre puerto 4200 y conecta con API en port 8000).

## Build de Producción
`npm run build` genera archivos en `dist/gestor-coc/browser/`, los cuales son servidos por el backend mediante WhiteNoise.
