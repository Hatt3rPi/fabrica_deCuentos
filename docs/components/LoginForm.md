# 📱 LoginForm

Formulario de inicio de sesión para la aplicación.

## 📋 Descripción

El `LoginForm` es un componente React que permite a los usuarios iniciar sesión en la aplicación mediante sus credenciales de correo electrónico y contraseña.

## 🔧 Props

```typescript
interface LoginFormProps {
  onLoginSuccess?: () => void;
  onSignUp?: () => void;
  onResetPassword?: () => void;
}
```

## 🎨 Estilos

- Diseño responsive
- Estados de carga
- Estados de error
- Feedback visual

## 📊 Estado

- Estado de carga
- Estado de error
- Manejo de formularios
- Validación de datos

## 🔄 Funcionalidades

1. **Formulario**
   - Campos de entrada
   - Validación en tiempo real
   - Mensajes de error
   - Acciones de navegación

2. **Autenticación**
   - Inicio de sesión
   - Registro
   - Recuperación de contraseña

3. **Seguridad**
   - Validación de datos
   - Protección contra CSRF
   - Gestión de errores

## 🔗 Dependencias

### Consumidores

- `App`: Componente principal
- `PrivateRoute`: Rutas protegidas

### Dependencias

1. **Contextos**
   - `AuthContext`: Gestión de autenticación

2. **Librerías**
   - `React Router DOM`: Navegación
   - `Lucide Icons`: Iconos
   - `Framer Motion`: Animaciones

## 🎯 Casos de Uso

### 1. Inicio de Sesión

#### Criterios de Éxito
- ✅ Validación de credenciales
- ✅ Inicio de sesión exitoso
- ✅ Redirección al dashboard
- ✅ Sesión activa

#### Criterios de Fallo
- ❌ Credenciales inválidas
- ❌ Error de conexión
- ❌ Usuario no encontrado
- ❌ Sesión expirada

### 2. Navegación

#### Criterios de Éxito
- ✅ Redirección al registro
- ✅ Redirección a recuperación
- ✅ Navegación entre secciones
- ✅ Accesibilidad

#### Criterios de Fallo
- ❌ Enlace roto
- ❌ Error de navegación
- ❌ Estado inválido

### 3. Validación

#### Criterios de Éxito
- ✅ Validación en tiempo real
- ✅ Mensajes de error claros
- ✅ Feedback visual
- ✅ Corrección de errores

#### Criterios de Fallo
- ❌ Datos inválidos
- ❌ Error en validación
- ❌ Mensajes confusos

## 🛠️ Contextos

- Utiliza `AuthContext` para autenticación
- Se integra con Supabase Auth
- Proporciona feedback visual

## 🐛 Consideraciones

- Validación de datos
- Manejo de estados
- Gestión de errores
- Seguridad en datos
- Accesibilidad
