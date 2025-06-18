# 📚 Documentación de Soluciones

Esta sección contiene la documentación detallada de todas las soluciones implementadas en el proyecto, organizadas por área temática.

## 📋 Índice de Soluciones

### 🎨 UI/UX Corrections
- [preview-corrections/](./preview-corrections/) - Correcciones quirúrgicas en vista previa: prompt condicional y fallback export

### 🔧 System Features  
- [story-completion/](./story-completion/) - Sistema completo end-to-end de finalización con exportación PDF
- [real-pdf-generation/](./real-pdf-generation/) - Implementación real de generación de PDFs con Puppeteer

### 🚀 Performance Improvements
- *Documentación por agregar* - Generación paralela de imágenes (ver `/docs/tech/parallel-image-generation.md`)

## 📝 Cómo Documentar una Nueva Solución

### 1. Crear Carpeta
```bash
mkdir docs/solutions/nombre-solucion/
```

### 2. Usar Template
Copiar `/docs/templates/solution.md` como base para `README.md`

### 3. Estructura Recomendada
```
docs/solutions/nombre-solucion/
├── README.md          # Documentación principal (usa template)
├── changes.md         # Detalles técnicos específicos (opcional)
├── testing.md         # Plan de testing detallado (opcional)
└── assets/           # Screenshots, diagramas, etc. (opcional)
```

### 4. Vincular desde Aquí
Agregar entry en el índice de arriba con descripción breve.

## 🎯 Convenciones

### Naming
- Usar kebab-case para nombres de carpetas
- Nombre descriptivo del problema resuelto
- Evitar versioning en el nombre (usar git history)

### Contenido
- **README.md** principal debe seguir template exactamente
- Incluir links a PRs y issues relacionados
- Documentar tanto la solución como el problema original
- Incluir plan de testing específico

### Mantenimiento
- Actualizar cuando se hacen cambios posteriores
- Remover documentación obsoleta
- Referenciar desde otras partes de la documentación

## 🔗 Referencias
- [Templates de Documentación](../templates/)
- [Guía de Contribución](../../CLAUDE.md)
- [Troubleshooting](../maintenance/troubleshooting.md)