# Sistema de Configuración Admin de Dedicatoria

## 📋 Issues Resueltos
- Issue #267: Agregar configuración de dedicatoria en admin/style y restringir opciones de usuario
- Bug adicional: Dedicatoria vacía no aparecía en PDF cuando usuario elegía tenerla

## 🎯 Objetivo
Implementar un sistema completo de configuración administrativa para dedicatorias que permita:
1. **Configurar estilos** y restricciones desde admin/style
2. **Restringir opciones** de usuario a las permitidas por admin
3. **Usar imagen de fondo** configurada por admin en preview, PDF y visualización
4. **Persistir configuraciones** automáticamente

## 📁 Archivos Modificados

### Frontend - Sistema Admin
- `src/pages/Admin/StyleEditor/AdminStyleEditor.tsx` - Tercera sección "Dedicatoria" con controles completos
- `src/pages/Admin/StyleEditor/components/StylePreview.tsx` - Preview de dedicatoria con imagen de fondo
- `src/types/styleConfig.ts` - Nuevos tipos para DedicatoriaConfig y StyleTemplate
- `src/services/styleConfigService.ts` - Métodos para 3 imágenes específicas y persistencia

### Frontend - Restricciones Usuario  
- `src/components/Wizard/steps/DedicatoriaStep.tsx` - Carga configuración admin y restringe opciones
- `src/components/Wizard/steps/components/LayoutConfig.tsx` - Filtra layouts/alineaciones según admin
- `src/components/Wizard/steps/components/DedicatoriaPreview.tsx` - Preview con imagen de fondo
- `src/hooks/useDedicatoriaConfig.ts` - Hook para configuración y imagen de fondo

### Frontend - Visualización
- `src/pages/StoryReader.tsx` - Renderiza dedicatoria con imagen de fondo y layout
- `src/hooks/useStoryReader.ts` - Incluye página de dedicatoria cuando existe

### Backend
- `supabase/functions/story-export/index.ts` - Usa imagen de fondo en PDF con overlay y estilos
- `src/services/storyService.ts` - Persiste URL de imagen de fondo en BD

### Base de Datos
- `supabase/migrations/20250627000000_add_custom_images_to_templates.sql` - Campos para imágenes custom
- `supabase/migrations/20250627001000_add_dedicatoria_background_url.sql` - Campo para imagen de fondo

## 🔧 Cambios Técnicos

### Antes
```typescript
// Sin configuración admin para dedicatoria
interface DedicatoriaConfig {
  text: PageTextConfig;
  // No había restricciones ni imagen de fondo
}

// Usuario veía todas las opciones sin restricciones
const allLayouts = ['imagen-arriba', 'imagen-abajo', 'imagen-izquierda', 'imagen-derecha'];
```

### Después  
```typescript
// Sistema completo con configuración admin
interface DedicatoriaConfig {
  text: PageTextConfig;
  imageSize: 'pequena' | 'mediana' | 'grande';
  allowedLayouts: ('imagen-arriba' | 'imagen-abajo' | 'imagen-izquierda' | 'imagen-derecha')[];
  allowedAlignments: ('centro' | 'izquierda' | 'derecha')[];
  backgroundImageUrl?: string; // Imagen de fondo para páginas
  backgroundImagePosition?: 'cover' | 'contain' | 'center';
}

// Usuario solo ve opciones permitidas
].filter(option => allowedLayouts.includes(option.value)).map((option) => (
```

### Sistema de 3 Imágenes Específicas
```typescript
// Antes: Una sola imagen genérica
async getRandomSampleImage(): Promise<string | null>

// Después: 3 imágenes específicas por tipo
async getCoverSampleImage(): Promise<string>
async getPageSampleImage(): Promise<string>  
async getDedicatoriaSampleImage(): Promise<string>
async getAllSampleImages(): Promise<{ cover: string; page: string; dedicatoria: string; }>
```

### Descripción del Cambio
Se implementó un sistema completo que separa las responsabilidades:
1. **Admin configura**: Estilos, restricciones e imagen de fondo en `/admin/style`
2. **Usuario usa**: Solo opciones permitidas en wizard con preview en tiempo real
3. **Sistema aplica**: Configuración en preview, PDF y visualización automáticamente

## 🧪 Testing

### Manual
- [x] Verificar sección "Dedicatoria" en admin/style funcional
- [x] Verificar que se guardan/cargan automáticamente las 3 imágenes custom
- [x] Verificar que usuarios solo ven opciones permitidas por admin
- [x] Verificar que tamaño de imagen se controla desde admin (read-only para usuario)
- [x] Verificar imagen de fondo en preview del wizard
- [x] Verificar imagen de fondo en PDF generado con overlay y texto blanco
- [x] Verificar imagen de fondo en visualización de cuento (StoryReader)
- [x] Verificar que dedicatoria aparece en PDF cuando usuario elige "SÍ" sin texto
- [ ] Testing completo del flujo: configurar admin → crear cuento → PDF → visualización

### Automatizado
- [ ] `npm run cypress:run` - Tests existentes deben pasar
- [ ] Test específico para dedicatoria vacía en PDF
- [ ] Verificar no regresiones en wizard de creación de cuentos

## 🚀 Deployment

### Requisitos
- [x] Migraciones de BD ejecutadas correctamente
- [x] Edge Function actualizada en Supabase
- [x] Configuración admin existente compatible

### Pasos
1. Ejecutar migraciones de BD para nuevos campos
2. Desplegar Edge Function actualizada
3. Desplegar frontend con nuevas funcionalidades
4. Verificar que admin puede acceder a nueva sección "Dedicatoria"
5. Verificar que usuarios ven opciones restringidas correctamente

## 📊 Monitoreo

### Métricas a Observar
- **Uso de sección Dedicatoria**: Verificar que admins usan la nueva sección
- **Generación de PDF**: Confirmar que PDFs incluyen imagen de fondo correctamente
- **Performance**: Verificar que carga de 3 imágenes no afecte velocidad
- **Errores de configuración**: Monitorear errores al cargar configuración admin

### Posibles Regresiones
- **Dedicatorias existentes**: Verificar que cuentos anteriores siguen funcionando
- **PDF sin imagen**: Confirmar que PDFs sin imagen de fondo se ven correctamente
- **Wizard flow**: Asegurar que restricciones no bloqueen flujo completo
- **Performance admin**: Verificar que carga de StylePreview sea fluida

## 🎨 Diferencias Importantes

### Dos tipos de imágenes en dedicatoria:
1. **Imagen DE dedicatoria** = La que sube el USUARIO (aparece dentro del contenido, controlada por layout)
2. **Imagen DE FONDO** = La que configura el ADMIN (fondo de toda la página, siempre cover/center)

### Flujo completo implementado:
```
Admin (admin/style) → Configuración guardada en BD → Usuario (wizard restringido) → Preview en tiempo real → PDF con imagen de fondo → Visualización con imagen de fondo
```

## 🔗 Referencias
- [PR #273](https://github.com/Customware-cl/Lacuenteria/pull/273)
- [Issue #267](https://github.com/Customware-cl/Lacuenteria/issues/267)
- [Documentación sistema de templates](/docs/tech/style-templates.md)
- [Documentación Edge Functions](/docs/tech/story-export.md)