# 📱 CharacterCard

Tarjeta individual que muestra la información de un personaje.

## 📋 Descripción

El `CharacterCard` es un componente React que muestra la información de un personaje en una tarjeta con animaciones y acciones de edición y eliminación.

## 🔧 Props

```typescript
interface CharacterCardProps {
  character: Character;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}
```

## 🎨 Estilos

- Diseño responsive
- Animaciones con Framer Motion
- Efectos hover
- Layout flexible

## 📊 Estado

- Estado de carga
- Manejo de errores
- Estado de eliminación

## 🔄 Funcionalidades

1. **Visualización**
   - Muestra imagen del personaje
   - Muestra nombre y edad
   - Muestra descripción
   - Gestiona estados de carga

2. **Acciones**
   - Botón de editar
   - Botón de eliminar
   - Manejo de eventos

## 🔗 Dependencias

### Consumidores

- `CharactersGrid`: Muestra la lista de personajes

### Dependencias

1. **Contextos**
   - `AuthContext`: Gestión de permisos

2. **Librerías**
   - `Framer Motion`: Animaciones
   - `Lucide Icons`: Iconos

## 🎯 Casos de Uso

### 1. Visualización de Personaje

#### Criterios de Éxito
- ✅ Mostrar tarjeta completa
- ✅ Mostrar imagen o placeholder
- ✅ Mostrar información básica
- ✅ Mostrar descripción

#### Criterios de Fallo
- ❌ Datos inválidos
- ❌ Imagen no disponible
- ❌ Error en renderizado

### 2. Acciones sobre Personaje

#### Criterios de Éxito
- ✅ Redirección al formulario de edición
- ✅ Confirmación de eliminación
- ✅ Manejo de eventos

#### Criterios de Fallo
- ❌ Usuario sin permisos
- ❌ Acción cancelada
- ❌ Error en navegación

## 🛠️ Contextos

- Utiliza `AuthContext` para permisos
- Se integra con `CharactersGrid` para la lista

## 🐛 Consideraciones

- Manejo de estados de carga
- Validación de datos
- Gestión de errores
- Animaciones suaves
