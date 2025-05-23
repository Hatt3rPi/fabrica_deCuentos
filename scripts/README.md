# Scripts para Imágenes de Respaldo

Este directorio contiene scripts útiles para trabajar con las imágenes de respaldo por estilo visual.

## Scripts Disponibles

### `download_fallback_images.sh`

Script para descargar imágenes de ejemplo para los estilos visuales. Estas imágenes son solo ejemplos y deberán ser reemplazadas con imágenes finales.

```bash
./scripts/download_fallback_images.sh
```

### `optimize_fallback_images.sh`

Script para optimizar las imágenes de respaldo, asegurando que cumplan con los requisitos de tamaño y formato.

```bash
./scripts/optimize_fallback_images.sh
```

### `verify_fallback_images.sh`

Script para verificar que las imágenes de respaldo cumplan con todos los criterios especificados.

```bash
./scripts/verify_fallback_images.sh
```

### `pre-commit-hook.sh`

Hook de pre-commit para verificar las imágenes de respaldo antes de confirmar los cambios.

Para instalar este hook:

```bash
cp scripts/pre-commit-hook.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

## Requisitos

Estos scripts requieren las siguientes herramientas:

- `imagemagick`: Para manipulación de imágenes
- `webp`: Para conversión a formato WebP
- `curl`: Para descargar imágenes de ejemplo

Para instalar estas herramientas:

### Ubuntu/Debian

```bash
sudo apt-get update
sudo apt-get install imagemagick webp curl
```

### macOS

```bash
brew install imagemagick webp curl
```

### Windows

Se recomienda usar WSL (Windows Subsystem for Linux) o instalar las herramientas a través de [Chocolatey](https://chocolatey.org/):

```bash
choco install imagemagick webp curl
```

## Flujo de Trabajo Recomendado

1. Generar o seleccionar imágenes para cada estilo visual
2. Colocar las imágenes en `supabase/storage/fallback-images/`
3. Ejecutar `./scripts/optimize_fallback_images.sh` para optimizarlas
4. Ejecutar `./scripts/verify_fallback_images.sh` para verificar que cumplan con los requisitos
5. Subir las imágenes a Supabase Storage
6. Actualizar las URLs públicas en `supabase/storage/fallback-images/README.md`

