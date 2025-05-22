Épica: WIZARD - [3] VISUALIZACIÓN
Categoría: Feature
Identificador: LAC-22
Notas para devs: Implementar visualización de variantes de personajes según el estilo visual seleccionado, con manejo de múltiples personajes y estados de carga.

Archivos afectados:
- src/components/VisualStyleSelector/VisualStyleCard.tsx (modificar)
- src/components/Character/CharacterVariants.tsx (nuevo)
- src/hooks/useCharacterVariants.ts (nuevo)
- src/stores/characterStore.ts (modificar)
- src/types/character.ts (extender)
- src/styles/components/_visual-style-selector.scss (modificar)

🧠 Contexto:
Se requiere implementar un componente que muestre miniaturas de los personajes con variantes visuales según el estilo seleccionado. El sistema debe manejar desde 1 hasta 3 personajes, mostrando las variantes correspondientes a cada estilo visual.

📐 Objetivo:
Crear una experiencia visual atractiva que muestre las variantes de los personajes según el estilo visual seleccionado, con manejo de estados de carga y respaldo para imágenes no generadas.

✅ CRITERIOS DE ÉXITO (lo que sí debe ocurrir):

- [ ] Sin errores en consola
- [ ] Componente completamente responsivo (mobile/desktop)
- [ ] Manejo de 1 a 3 personajes
- [ ] Visualización de variantes por estilo visual
- [ ] Carga progresiva de imágenes
- [ ] Manejo de estados de carga
- [ ] Uso de imágenes genéricas como respaldo
- [ ] Transiciones suaves entre estilos
- [ ] Accesibilidad (alt text, focus states)
- [ ] Tipado TypeScript completo
- [ ] Documentación de props y tipos
- [ ] Pruebas unitarias básicas
- [ ] Optimización de rendimiento

❌ CRITERIOS DE FALLA (lo que no debe ocurrir):

- [ ] Errores en consola
- [ ] Layout shifts excesivos
- [ ] Problemas de rendimiento con múltiples imágenes
- [ ] Pérdida de estado al cambiar de vista
- [ ] Inconsistencias visuales entre navegadores
- [ ] Problemas de accesibilidad
- [ ] Imágenes pixeladas o de baja calidad
- [ ] Tiempos de carga excesivos
- [ ] Errores con datos faltantes
- [ ] Problemas de memoria con múltiples imágenes

🧪 CASOS DE PRUEBA:

1. Historia con 1 personaje:
   - [ ] Verificar que se muestre una sola columna de variantes
   - [ ] Confirmar que las miniaturas sean del estilo seleccionado
   - [ ] Verificar carga de imágenes genéricas cuando corresponda

2. Historia con 2 personajes:
   - [ ] Verificar disposición en dos columnas
   - [ ] Confirmar que cada personaje muestre sus variantes
   - [ ] Verificar que las imágenes mantengan proporciones

3. Historia con 3 personajes:
   - [ ] Verificar disposición en tres columnas
   - [ ] Confirmar que el diseño sea responsive
   - [ ] Verificar que no haya superposición de elementos

4. Estados de carga:
   - [ ] Verificar estados de carga inicial
   - [ ] Probar con conexión lenta
   - [ ] Verificar manejo de errores

5. Navegación:
   - [ ] Cambiar entre estilos visuales
   - [ ] Navegar entre pasos del wizard
   - [ ] Verificar persistencia de selección

ESTRUCTURA DE DATOS REQUERIDA:

```typescript
interface CharacterVariant {
  id: string;
  characterId: string;
  style: 'acuarela-digital' | 'dibujado-a-manos' | 'recortes-de-papel' | 'kawaii';
  imageUrl: string;
  thumbnailUrl: string;
  isDefault?: boolean;
  createdAt: string;
}

interface CharacterWithVariants extends Character {
  variants: CharacterVariant[];
  currentStyle?: string;
}
```

INSTRUCCIONES DE IMPLEMENTACIÓN:

1. Crear componente `CharacterVariants`:
   - Mostrar miniaturas de variantes
   - Manejar estados de carga/error
   - Implementar lazy loading

2. Modificar `VisualStyleCard`:
   - Integrar con el componente de variantes
   - Pasar el estilo visual seleccionado
   - Manejar la lógica de visibilidad

3. Actualizar store de personajes:
   - Agregar soporte para variantes
   - Implementar selección de estilos
   - Manejar caché de imágenes

4. Estilos:
   - Diseño responsivo
   - Efectos hover/focus
   - Transiciones suaves
   - Indicadores de carga

5. Optimizaciones:
   - Precarga de imágenes
   - Lazy loading
   - Tamaños de imagen adecuados
   - Caché de recursos

EXTRAS:
- Considerar implementar skeleton loaders
- Agregar animaciones sutiles
- Documentar el componente en Storybook
- Agregar pruebas E2E
