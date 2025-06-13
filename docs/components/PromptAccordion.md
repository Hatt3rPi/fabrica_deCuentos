# 📂 PromptAccordion

Acordeón utilizado en la administración para editar cada prompt.

## 📋 Descripción

Muestra el tipo, versión y fecha de modificación del prompt. Al colapsar el acordeón se incluyen badges con los nombres de las Edge Functions que usan dicho prompt.

En la parte superior de la página se muestran todos los badges de funciones y al seleccionar uno se filtran los prompts asociados.

## 🔧 Props

```typescript
interface PromptAccordionProps {
  prompt: Prompt;
  onSave: (content: string, endpoint: string, model: string) => Promise<void> | void;
}
```

## 🎨 Estilos

- Badges con colores pasteles distintos para cada Edge Function.
- Diseño responsive y acorde al resto del panel de administración.

Al editar un prompt de imágenes se muestran campos para elegir tamaño y calidad cuando se usa OpenAI, o ancho y alto cuando se usa Flux. Las opciones disponibles se definen en `src/constants/imageOptions.ts`.
Los colores de los badges están configurados en `src/constants/edgeFunctionColors.ts`.
