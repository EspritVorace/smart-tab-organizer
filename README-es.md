[![en](https://img.shields.io/badge/lang-en-red.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/master/README.md)
[![fr](https://img.shields.io/badge/lang-fr-blue.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/master/README-fr.md)
[![es](https://img.shields.io/badge/lang-es-yellow.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/master/README-es.md)

# SmartTab Organizer

![Version](https://img.shields.io/badge/version-1.0.3-blue.svg)
![Licencia](https://img.shields.io/badge/License-GPL_v3-blue.svg)

**SmartTab Organizer** es una extensi&oacute;n multinavegador dise&ntilde;ada para ayudarte a administrar eficientemente tus pesta&ntilde;as agrupando autom&aacute;ticamente las pesta&ntilde;as relacionadas y evitando duplicados.

## Caracter&iacute;sticas

### Agrupaci&oacute;n Autom&aacute;tica
* Clic central en un enlace para abrir la pesta&ntilde;a en el grupo adecuado si el dominio coincide con tus reglas.
* La pesta&ntilde;a se une a un grupo existente o se crea uno nuevo.
* El nombre del grupo puede obtenerse del t&iacute;tulo de la pesta&ntilde;a de origen, de su URL o solicitarse manualmente.
* Preajustes de expresiones regulares para herramientas populares de tickets (Jira, GitLab, GitHub, Trello, etc.).

### Deduplicaci&oacute;n
* Se evita abrir dos veces la misma URL.
* La pesta&ntilde;a existente se vuelve a enfocar y se recarga.
* Modos de coincidencia: URL exacta, nombre de host + ruta, solo nombre de host o coincidencia por inclusi&oacute;n.

### Opciones y Personalizaci&oacute;n
* A&ntilde;adir, editar, eliminar o activar/desactivar reglas de dominio.
* Gestionar preajustes y expresiones regulares personalizadas con una interfaz intuitiva basada en tarjetas.
* Importar/exportar la configuraci&oacute;n en JSON.
* Configurar los modos de deduplicaci&oacute;n por regla.
* Consultar las estad&iacute;sticas (grupos creados y pesta&ntilde;as deduplicadas) y restablecerlas.
* Elegir el tema Claro, Oscuro o Sistema.

### Popup de Acceso R&aacute;pido
* Activar/desactivar globalmente la agrupaci&oacute;n y la deduplicaci&oacute;n.
* Ver estad&iacute;sticas clave de un vistazo (secci&oacute;n plegable con estado persistido).
* Acceso directo a la p&aacute;gina de opciones.

### Accesibilidad
* Navegaci&oacute;n completa por teclado en todos los componentes.
* Soporte para lectores de pantalla con etiquetas ARIA y landmarks adecuados.
* Construido sobre primitivas Radix UI para accesibilidad nativa.

### Internacionalizaci&oacute;n
* Disponible en Ingl&eacute;s, Franc&eacute;s y Espa&ntilde;ol.

## Instalaci&oacute;n

### Manual (Desarrollo / Pruebas)

1.  **Descargar:** Clona o descarga este proyecto.
    ```bash
    git clone https://github.com/EspritVorace/smart-tab-organizer.git
    ```
2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

#### Modo Desarrollo (con recarga autom&aacute;tica)
3.  **Iniciar servidor de desarrollo:**
    ```bash
    # Para desarrollo en Chrome
    npm run dev

    # Para desarrollo en Firefox
    npm run dev:firefox
    ```

#### Build de Producci&oacute;n
3.  **Construir la extensi&oacute;n:**
    ```bash
    npm run build
    ```

#### Empaquetado para Distribuci&oacute;n
3.  **Crear paquetes de distribuci&oacute;n:**
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
5.  &iexcl;La extensi&oacute;n est&aacute; lista!

## Uso

1.  **Haz Clic en el Icono:** Para acceder al popup.
2.  **Configurar:** Abre "Opciones" para establecer tus reglas.
    * **Reglas de Dominio:** Define para qu&eacute; sitios activar las funciones.
    * **Preajustes de RegEx:** Crea o usa RegEx para extraer nombres de grupos (ej: `([A-Z]+-\d+)` para Jira).
3.  **Navega:** Usa el clic central en los sitios configurados &iexcl;y observa la magia suceder!

## Pruebas

```bash
# Pruebas unitarias
npm test

# Pruebas E2E
npm run test:e2e

# Storybook (documentaci&oacute;n de componentes)
npm run storybook
```

## Tecnolog&iacute;as Utilizadas

### Core
* TypeScript y React
* WXT framework para desarrollo de extensiones multinavegador
* APIs de extensiones de Chrome/Firefox (Manifiesto V3 / V2)

### UI
* **@radix-ui/themes** - Sistema de dise&ntilde;o y componentes UI
* **@radix-ui/react-collapsible** - Patrones accesibles de plegar/desplegar
* **next-themes** - Gesti&oacute;n de temas (modo oscuro/claro)
* **lucide-react** - Iconos SVG
* **react-hook-form** - Gesti&oacute;n de formularios

### Validaci&oacute;n
* **Zod** - Validaci&oacute;n de esquemas

### Pruebas
* **Vitest** - Pruebas unitarias con Happy DOM
* **Playwright** - Pruebas end-to-end
* **Storybook** - Documentaci&oacute;n y pruebas visuales de componentes

## Licencia

Este proyecto est&aacute; bajo la licencia **GNU General Public License v3.0**.

---
