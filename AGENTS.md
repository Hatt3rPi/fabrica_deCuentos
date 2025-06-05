
# Procura responder siempre en español
# Para todos los diseños de componentes que te soliciten. asegúrate de que queden hermosos y hagan sinergia con el resto de la página. 
# Guía de Buenas Prácticas y Mantenimiento del Proyecto

## 📝 Mantener la documentación al día

- Cada cambio en componentes o funciones debe reflejarse en los archivos dentro de `docs/`.
- Por ejemplo, la carpeta `docs/components` contiene descripciones y props de cada componente (ver `docs/components/CharacterCard.md` como referencia).
- Tras agregar o modificar funcionalidades, actualiza el `CHANGELOG.md` e incluye enlaces a la documentación correspondiente.

## 🔄 Sincronización con Supabase

- Cuando se modifiquen funciones Edge o el esquema de la base de datos, sigue el flujo descrito en `docs/tech/supabase-sync.md` para mantener el repositorio alineado con el proyecto remoto.
- Esto implica ejecutar:

```bash
npm run supabase:pull
npm run supabase:start
```

- **Evita editar directamente desde el dashboard de Supabase**.
- Documenta cualquier cambio urgente y sincroniza de inmediato para reflejarlo en el repo.

## 🤖 Uso responsable de proveedores de IA

- Antes de trabajar con OpenAI, Flux u otro proveedor, revisa su documentación oficial.
- El repositorio contiene notas claras al respecto al inicio de:

```
docs/tech/ai-providers/openai/README.md
docs/tech/ai-providers/flux/README.md
```

- Asegura que cualquier nuevo código siga esas directrices de parámetros y buenas prácticas.

## 🌿 Flujo de trabajo y Git

- Sigue el modelo de GitFlow integrado con Linear detallado en el `README`:
  - Crear ramas `feature/*`, `bug/*`, etc.
  - Asociar cada issue a su rama correspondiente.
- Utiliza commits descriptivos que mencionen el issue de Linear.
- Abre una Pull Request hacia `main` al finalizar.

## ✅ Pruebas y calidad de código

- Ejecuta `npm run lint` y las pruebas E2E (`npm run test:e2e` o `cypress run`) antes de subir una rama.
- El `README` explica la estructura y configuración de Cypress.
- Revisa que los scripts de `package.json` sigan funcionando correctamente antes de cada merge.


## 📌 Otras prácticas recomendadas

- Mantener actualizadas las variables de entorno necesarias para las pruebas y la ejecución local.
- Documentar en `docs/tech` cualquier decisión de arquitectura o configuración especial añadida al proyecto.
- Si se agrega un nuevo proveedor de IA o se cambia la estructura de Supabase, incluir inmediatamente la explicación en la documentación.