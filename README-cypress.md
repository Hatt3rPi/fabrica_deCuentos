# Pruebas E2E con Cypress

Este documento describe cómo ejecutar y mantener las pruebas end-to-end (E2E) para La CuenterIA utilizando Cypress.

## Requisitos previos

- Node.js (versión 16 o superior)
- npm (incluido con Node.js)
- La aplicación La CuenterIA instalada localmente

## Instalación

Las dependencias de Cypress ya están incluidas en el `package.json` del proyecto. Para instalarlas, ejecuta:

```bash
npm install
```

## Ejecutar las pruebas

### Modo interactivo

Para abrir Cypress en modo interactivo, ejecuta:

```bash
npm run cypress:open
```

Esto abrirá la interfaz de Cypress donde podrás seleccionar y ejecutar pruebas específicas.

### Modo headless

Para ejecutar todas las pruebas en modo headless (sin interfaz gráfica), ejecuta:

```bash
npm run test:e2e
```

## Estructura de las pruebas

Las pruebas E2E están organizadas de la siguiente manera:

- `cypress/e2e/flujos_principales.cy.js`: Contiene las pruebas para los flujos principales de la aplicación
- `cypress/support/commands.js`: Contiene comandos personalizados para acciones comunes
- `cypress/fixtures/test-data.json`: Contiene datos de prueba como credenciales y datos de personajes
- `cypress/fixtures/Sheldon-the-best1.webp`: Imagen de prueba para la creación de personajes

## Comandos personalizados

- Se han creado varios comandos personalizados para facilitar las pruebas:

- `cy.navigateToLogin()`: Navega desde la landing page hasta el formulario de login.
- `cy.login(email, password)`: Inicia sesión con las credenciales proporcionadas.
- `cy.openNewStoryModal()`: Abre el asistente de creación de cuentos y muestra el modal de selección de personajes.
- `cy.createNewCharacterFromModal()`: Abre el formulario para crear un personaje dentro de dicho modal.
- `cy.createCharacter(name, age, description, imagePath)`: Crea un nuevo personaje utilizando el flujo antiguo (aún disponible para pruebas puntuales).
- `cy.checkRequiredFields()`: Verifica la validación de campos obligatorios en el formulario de personaje.
- `cy.cleanupTestData()`: Limpia los datos de prueba después de cada test.

## Datos de prueba

Los datos de prueba se encuentran en `cypress/fixtures/test-data.json` y contienen:

- Credenciales de usuario para iniciar sesión
- Datos para la creación de personajes

## Integración continua

Las pruebas E2E se ejecutan automáticamente en GitHub Actions cuando:

- Se hace push a las ramas `main` o `develop`
- Se crea un pull request hacia las ramas `main` o `develop`

La configuración de CI se encuentra en `.github/workflows/e2e-tests.yml`.

## Buenas prácticas

1. **Independencia de pruebas**: Cada prueba debe ser independiente y no depender del estado de otras pruebas.
2. **Limpieza de datos**: Utiliza `cy.cleanupTestData()` para limpiar los datos después de cada prueba.
3. **Selectores estables**: Utiliza selectores que sean menos propensos a cambiar (como atributos de datos).
4. **Timeouts adecuados**: Ajusta los timeouts para operaciones que pueden tardar más tiempo.
5. **Capturas de pantalla**: Cypress captura automáticamente capturas de pantalla en caso de fallos.

## Solución de problemas

### Pruebas lentas o inestables

- Verifica la conexión a internet
- Aumenta los timeouts en `cypress.config.js`
- Implementa reintentos para operaciones inestables

### Fallos en CI pero no localmente

- Verifica que las variables de entorno estén configuradas correctamente
- Asegúrate de que los recursos externos estén disponibles en el entorno de CI
- Revisa los logs y capturas de pantalla de las ejecuciones fallidas

