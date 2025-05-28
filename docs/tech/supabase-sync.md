# 🔄 Sincronización de Cambios en Supabase

Este documento describe el proceso recomendado para mantener el código local sincronizado con los cambios realizados en el proyecto de Supabase. Si en algún momento se modifican funciones Edge o el esquema de la base de datos directamente desde el dashboard de Supabase, sigue estos pasos para reflejar esas actualizaciones en el repositorio.

## 1. Preparación

1. Instala la CLI de Supabase (si aún no la tienes):

   ```bash
   npm install -g supabase
   ```

2. Inicia sesión en la CLI:

   ```bash
   supabase login
   ```

3. Enlaza tu proyecto local con el proyecto remoto (solo es necesario la primera vez):

   ```bash
   supabase link --project-ref <tu-project-ref>
   ```

## 2. Obtener los cambios desde Supabase

Ejecuta el script proporcionado en `package.json` para descargar las funciones Edge y el esquema actualizado:

```bash
npm run supabase:pull
```

Esto ejecuta internamente `supabase functions pull` y `supabase db pull`, lo que actualiza las carpetas `supabase/functions/` y `supabase/migrations/` con lo que existe en el proyecto remoto.

## 3. Verificar el entorno local

1. Inicia los servicios locales para comprobar que todo funciona:

   ```bash
   npm run supabase:start
   ```

2. Revisa que las migraciones se apliquen sin conflictos y que las funciones Edge se ejecuten correctamente.

## 4. Flujo de trabajo recomendado

- Evita hacer cambios directamente en el dashboard de Supabase. Siempre que sea posible, realiza modificaciones desde el entorno local y súbelas mediante migraciones y funciones versionadas.
- Si necesitas hacer un ajuste rápido en producción, documenta el cambio y sincroniza el repositorio siguiendo esta guía inmediatamente después.
- Considera implementar pruebas automatizadas que comparen el esquema local con el remoto para detectar diferencias inesperadas.

---

Siguiendo estos pasos se mantendrá la coherencia entre el repositorio local y el entorno de Supabase, reduciendo los problemas al ejecutar migraciones o desplegar nuevas versiones.
