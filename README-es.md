[![en](https://img.shields.io/badge/lang-en-red.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/master/README.md)
[![fr](https://img.shields.io/badge/lang-fr-blue.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/master/README-fr.md)
[![es](https://img.shields.io/badge/lang-es-yellow.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/master/README-es.md)

# SmartTab Organizer

![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)
![Licencia](https://img.shields.io/badge/License-GPL_v3-blue.svg)

**SmartTab Organizer** es una extensión multinavegador diseñada para ayudarte a administrar eficientemente tus pestañas agrupando automáticamente las pestañas relacionadas y evitando duplicados.

## Características

### Agrupación Automática
* Clic central en un enlace o clic derecho > "Abrir enlace en una pestaña nueva" para abrir la pestaña en el grupo adecuado si el dominio coincide con tus reglas.
* La pestaña se une a un grupo existente o se crea uno nuevo.
* El nombre del grupo puede obtenerse del título de la pestaña de origen, de su URL o solicitarse manualmente.
* Preajustes de expresiones regulares para herramientas populares de tickets (Jira, GitLab, GitHub, Trello, etc.).

### Deduplicación
* Se evita abrir dos veces la misma URL.
* La pestaña existente se vuelve a enfocar y se recarga.
* Modos de coincidencia: URL exacta, nombre de host + ruta, solo nombre de host o coincidencia por inclusión.

### Sesiones y Perfiles
* **Snapshots de sesión** — Guarda tus pestañas abiertas (incluidos los grupos de pestañas) como un snapshot con nombre mediante un asistente guiado. Las pestañas del sistema se excluyen automáticamente.
* **Perfiles** — Ancla cualquier snapshot como perfil persistente. Los perfiles aparecen al principio de la lista y en el popup para un acceso rápido. Asigna un icono personalizado de entre 10 opciones disponibles.
* **Tarjetas de sesión** — Cada tarjeta muestra el número de pestañas, el número de grupos, insignias de color y la fecha de última actualización. Haz doble clic en el nombre para renombrarlo en línea (Enter para confirmar, Escape para cancelar).
* **Restauración** — Botón dividido con restauración rápida en un clic (ventana actual o nueva ventana) o un **asistente de restauración** completo para seleccionar qué pestañas restaurar, elegir la ventana de destino y resolver conflictos (pestañas duplicadas, colisiones de nombres de grupos) antes de aplicar.
* **Editor de sesión** — Abre cualquier sesión guardada en un editor interactivo: renombrar la sesión, editar o eliminar pestañas individuales, editar URLs de pestañas, renombrar grupos, eliminar grupos (con sus pestañas o desagruparlas), y mover pestañas entre grupos. Una confirmación protege contra la pérdida accidental de datos al cerrar con cambios no guardados.
* **Auto-sync** *(solo perfiles)* — Activa el auto-sync en un perfil para capturar automáticamente tus pestañas abiertas de forma periódica y persistirlas al cerrar la ventana. Una alarma en segundo plano gestiona el ciclo de vida de la sincronización; una protección impide sobrescribir un perfil mientras su editor está abierto.
* **Exclusividad perfil ↔ ventana** — Cada perfil rastrea en qué ventana del navegador está abierto. El asistente de restauración te avisa si un perfil ya está abierto en otra ventana, y el popup refleja el estado en tiempo real de cada perfil (abierto aquí / abierto en otro lugar / cerrado).

### Opciones y Personalización
* Añadir, editar, eliminar o activar/desactivar reglas de dominio.
* Gestionar preajustes y expresiones regulares personalizadas con una interfaz intuitiva basada en tarjetas.
* **Asistente de Importación/Exportación** para reglas de dominio:
  * Exportar: seleccionar reglas individualmente, guardar como archivo JSON o copiar al portapapeles.
  * Importar: cargar desde archivo (arrastrar y soltar) o pegar JSON, con validación Zod.
  * Clasificación automática de reglas importadas (nuevas, en conflicto, idénticas).
  * Resolución de conflictos: sobrescribir, duplicar o ignorar, con vista diff lado a lado.
* Configurar los modos de deduplicación por regla.
* Consultar las estadísticas (grupos creados y pestañas deduplicadas) y restablecerlas.
* Elegir el tema Claro, Oscuro o Sistema.

### Popup de Acceso Rápido
* Activar/desactivar globalmente la agrupación y la deduplicación.
* Ver estadísticas clave de un vistazo (sección plegable con estado persistido).
* Botón **Guardar** para abrir instantáneamente el asistente de snapshot.
* Botón **Restaurar** para navegar a la sección Sesiones.
* **Lista de perfiles** — Los perfiles anclados se listan en el popup con su estado en tiempo real y acciones de restauración rápida.
* Acceso directo a la página de opciones.

### Accesibilidad
* Navegación completa por teclado en todos los componentes.
* Soporte para lectores de pantalla con etiquetas ARIA y landmarks adecuados.
* Construido sobre primitivas Radix UI para accesibilidad nativa.

### Internacionalización
* Disponible en Inglés, Francés y Español.

## Instalación

### Manual (Desarrollo / Pruebas)

1.  **Descargar:** Clona o descarga este proyecto.
    ```bash
    git clone https://github.com/EspritVorace/smart-tab-organizer.git
    ```
2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

#### Modo Desarrollo (con recarga automática)
3.  **Iniciar servidor de desarrollo:**
    ```bash
    # Para desarrollo en Chrome
    npm run dev

    # Para desarrollo en Firefox
    npm run dev:firefox
    ```

#### Build de Producción
3.  **Construir la extensión:**
    ```bash
    npm run build
    ```

#### Empaquetado para Distribución
3.  **Crear paquetes de distribución:**
    ```bash
    # Crear paquete Chrome
    npm run zip

    # Crear paquete Firefox
    npm run zip:firefox
    ```

#### Cargar en el Navegador
4.  **Cargar en tu navegador:**
    * Chrome/Chromium: abre `chrome://extensions/` y usa "Cargar descomprimida" con la carpeta `.output/chrome-mv3`.
    * Firefox: abre `about:debugging#/runtime/this-firefox` y elige "Cargar complemento temporal" apuntando a `.output/firefox-mv2/manifest.json`.
5.  ¡La extensión está lista!

## Uso

1.  **Haz Clic en el Icono:** Para acceder al popup.
2.  **Configurar:** Abre "Opciones" para establecer tus reglas.
    * **Reglas de Dominio:** Define para qué sitios activar las funciones.
    * **Preajustes de RegEx:** Crea o usa RegEx para extraer nombres de grupos (ej: `([A-Z]+-\d+)` para Jira).
3.  **Navega:** Usa el clic central o clic derecho > "Abrir enlace en una pestaña nueva" en los sitios configurados ¡y observa la magia suceder!
4.  **Sesiones:** Usa "Tomar snapshot" para guardar tus pestañas actuales, o "Nuevo perfil" para crear un perfil persistente con sincronización automática.

## Pruebas

```bash
# Pruebas unitarias
npm test

# Pruebas unitarias (entorno WXT)
npm run test:wxt

# Pruebas E2E (requiere un build previo)
npm run test:e2e

# Pruebas E2E con interfaz Playwright
npm run test:e2e:ui

# Build y luego pruebas E2E
npm run test:e2e:build

# Storybook (documentación de componentes)
npm run storybook
```

## Tecnologías Utilizadas

### Core
* TypeScript y React
* WXT framework para desarrollo de extensiones multinavegador
* APIs de extensiones de Chrome/Firefox (Manifiesto V3 / V2)

### UI
* **@radix-ui/themes** - Sistema de diseño y componentes UI
* **react-accessible-treeview** - Vista en árbol accesible para listas de pestañas en asistentes y el editor de sesión
* **@radix-ui/react-toast** - Notificaciones toast
* **next-themes** - Gestión de temas (modo oscuro/claro)
* **lucide-react** - Iconos SVG
* **react-hook-form** - Gestión de formularios

### Validación
* **Zod** - Validación de esquemas

### Pruebas
* **Vitest** - Pruebas unitarias con Happy DOM
* **Playwright** - Pruebas end-to-end
* **Storybook** - Documentación y pruebas visuales de componentes

## Licencia

Este proyecto está bajo la licencia **GNU General Public License v3.0**.

---
