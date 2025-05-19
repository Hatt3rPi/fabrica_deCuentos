# 📱 CharactersGrid

Componente principal para la gestión y visualización de personajes en la plataforma.

## 📋 Descripción

El `CharactersGrid` es un componente React que muestra una cuadrícula de personajes, permitiendo su creación, edición y eliminación. Utiliza un diseño responsive y se integra con el contexto de autenticación y el asistente.

## 🔧 Props

```typescript
interface CharactersGridProps {
  characters: Character[];
  onAddCharacter: () => void;
  onEditCharacter: (character: Character) => void;
  onDeleteCharacter: (id: string) => void;
}
```

## 🎨 Estilos

- Diseño en cuadrícula responsive
- Tarjetas de personaje con efecto hover
- Colores temáticos basados en Tailwind CSS
- Animaciones suaves para interacciones

## 📊 Estado

El componente mantiene:
- Estado de selección de personajes
- Estado de carga
- Mensajes de error

## 🔄 Funcionalidades

1. **Visualización**
   - Muestra tarjetas de personaje
   - Indica estado de carga
   - Muestra mensajes de error

2. **Interacción**
   - Permite agregar nuevos personajes
   - Permite editar personajes existentes
   - Permite eliminar personajes
   - Gestiona el estado de selección

## 📊 Uso

```tsx
import { CharactersGrid } from './components/Character/CharactersGrid';

function CharacterSection() {
  const { characters, addCharacter, editCharacter, deleteCharacter } = useCharacters();

  return (
    <CharactersGrid
      characters={characters}
      onAddCharacter={addCharacter}
      onEditCharacter={editCharacter}
      onDeleteCharacter={deleteCharacter}
    />
  );
}
```

## 🔗 Dependencias

### Consumidores

- `App.tsx`: Componente principal de la aplicación
- `MyStories.tsx`: Página principal de historias
- `CharacterForm.tsx`: Formulario de creación de personajes

### Dependencias

1. **Contextos**
   - `AuthContext`: Gestión de autenticación
   - `WizardContext`: Control del asistente
   - `CharacterStore`: Estado global de personajes

2. **Librerías**
   - `React Router DOM`: Navegación
   - `Framer Motion`: Animaciones
   - `Supabase`: Base de datos

## 🎯 Casos de Uso

### 1. Visualización de Personajes

#### Criterios de Éxito
- ✅ Mostrar cuadrícula de personajes existentes
- ✅ Mostrar mensaje cuando no hay personajes
- ✅ Mostrar alerta cuando se alcanza el límite
- ✅ Mantener orden cronológico inverso

#### Criterios de Fallo
- ❌ Error al cargar personajes
- ❌ Base de datos no disponible
- ❌ Usuario no autenticado
- ❌ Límite de personajes superado

### 2. Creación de Personajes

#### Criterios de Éxito
- ✅ Redirección al formulario de creación
- ✅ Validación de límite de personajes
- ✅ Actualización de estado global
- ✅ Guardado en base de datos

#### Criterios de Fallo
- ❌ Usuario sin permisos
- ❌ Límite de personajes alcanzado
- ❌ Error en la base de datos
- ❌ Sesión expirada

### 3. Edición de Personajes

#### Criterios de Éxito
- ✅ Redirección al formulario de edición
- ✅ Carga de datos existentes
- ✅ Actualización de estado global
- ✅ Actualización en base de datos

#### Criterios de Fallo
- ❌ Personaje no encontrado
- ❌ Datos inválidos
- ❌ Error en la base de datos
- ❌ Sesión expirada

### 4. Eliminación de Personajes

#### Criterios de Éxito
- ✅ Confirmación antes de eliminar
- ✅ Actualización de estado global
- ✅ Eliminación en base de datos
- ✅ Actualización de UI

#### Criterios de Fallo
- ❌ Usuario sin permisos
- ❌ Personaje no encontrado
- ❌ Error en la base de datos
- ❌ Sesión expirada

## 🛠️ Contextos

- Utiliza `AuthContext` para verificar permisos
- Se integra con `WizardContext` para el flujo de creación
- Depende de `CharacterStore` para estado global

## 🐛 Consideraciones

- Limitado a 3 personajes por cuento
- Requiere autenticación para todas las operaciones
- Gestiona estados de error y carga
- Implementa validaciones de datos
