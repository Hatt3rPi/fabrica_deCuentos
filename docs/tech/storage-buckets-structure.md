# Estructura de Buckets de Almacenamiento

## 📦 Buckets Requeridos

### 1. **storage** (Bucket Público Principal)
**Estado**: Existente  
**Acceso**: Público  
**Uso**: Imágenes de acceso general y contenido no sensible

```
storage/
├── covers/              # Portadas de cuentos
│   └── {story_id}/     # Una carpeta por cuento
├── thumbnails/          # Miniaturas de personajes
│   └── {character_id}/ # Una carpeta por personaje
├── characters/          # Imágenes completas de personajes
│   └── {user_id}/      # Organizadas por usuario
├── backgrounds/         # Fondos y elementos decorativos
│   ├── forest/
│   ├── castle/
│   └── space/
├── landing/            # Imágenes del landing page
│   ├── heroes/
│   └── features/
└── temp/               # Archivos temporales
    └── {session_id}/   # Limpieza automática después de 24h
```

**Políticas RLS**:
- `SELECT`: Permitir a todos (público)
- `INSERT`: Solo usuarios autenticados en sus carpetas
- `UPDATE`: Solo el propietario del archivo
- `DELETE`: Solo el propietario del archivo

---

### 2. **protected-storage** (Bucket Privado)
**Estado**: Creado en migraciones  
**Acceso**: Privado con URLs firmadas  
**Uso**: Contenido premium y páginas internas de cuentos

```
protected-storage/
├── {user_id}/
│   ├── pages/           # Páginas internas de cuentos
│   │   └── {story_id}/
│   │       ├── page_1.webp
│   │       ├── page_2.webp
│   │       └── ...
│   ├── downloads/       # PDFs y archivos descargables
│   │   └── {story_id}/
│   │       └── cuento.pdf
│   └── premium/         # Contenido premium adicional
│       └── {asset_id}/
```

**Políticas RLS**:
- `SELECT`: Solo el propietario (auth.uid() = user_id)
- `INSERT`: Solo en carpeta propia
- `UPDATE`: Solo archivos propios
- `DELETE`: Solo archivos propios

---

### 3. **exports** (Bucket de Exportaciones)
**Estado**: Por crear  
**Acceso**: Privado temporal  
**Uso**: PDFs generados y archivos de exportación

```
exports/
├── pdfs/
│   └── {user_id}/
│       └── {story_id}/
│           ├── preview.pdf    # Vista previa
│           └── final.pdf      # Versión final
├── print/                     # Archivos para impresión
│   └── {order_id}/
└── temp/                      # Exportaciones temporales
    └── {session_id}/          # Auto-limpieza después de 1h
```

**Políticas RLS**:
- URLs firmadas con expiración corta (1 hora)
- Solo acceso al propietario
- Limpieza automática de archivos antiguos

---

### 4. **admin-assets** (Bucket Administrativo)
**Estado**: Por crear  
**Acceso**: Solo administradores  
**Uso**: Assets del sistema y plantillas

```
admin-assets/
├── templates/           # Plantillas de diseño
│   ├── covers/
│   └── pages/
├── watermarks/          # Marcas de agua
│   └── lacuenteria.png
├── fonts/              # Fuentes personalizadas
└── system/             # Imágenes del sistema
    ├── placeholders/
    └── defaults/
```

**Políticas RLS**:
- Solo acceso a usuarios con rol 'admin'
- Lectura pública para assets específicos

---

## 🔧 Script de Configuración

```sql
-- Crear bucket de exportaciones
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exports',
  'exports',
  false,
  104857600, -- 100MB
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'application/zip']
);

-- Crear bucket de assets administrativos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'admin-assets',
  'admin-assets',
  false,
  10485760, -- 10MB
  ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'font/ttf', 'font/woff', 'font/woff2']
);

-- Políticas para exports
CREATE POLICY "Users can manage their exports"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'exports' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Políticas para admin-assets
CREATE POLICY "Admins can manage assets"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'admin-assets' AND
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Política de lectura pública para assets específicos
CREATE POLICY "Public read for system assets"
  ON storage.objects
  FOR SELECT
  TO public
  USING (
    bucket_id = 'admin-assets' AND
    (storage.foldername(name))[1] = 'system'
  );
```

## 📊 Resumen de Uso

| Bucket | Tipo | Contenido | Acceso |
|--------|------|-----------|---------|
| `storage` | Público | Portadas, miniaturas, landing | URLs directas |
| `protected-storage` | Privado | Páginas de cuentos, premium | URLs firmadas |
| `exports` | Temporal | PDFs, exportaciones | URLs firmadas (1h) |
| `admin-assets` | Sistema | Plantillas, watermarks | Admin + público selectivo |

## 🚀 Próximos Pasos

1. Ejecutar script de creación para buckets faltantes
2. Configurar políticas RLS
3. Implementar limpieza automática
4. Configurar CDN para bucket público (opcional)