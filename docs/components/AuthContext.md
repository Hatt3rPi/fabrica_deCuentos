# 🔐 AuthContext

Contexto de React para la gestión de autenticación en la aplicación.

## 📋 Descripción

El `AuthContext` es un contexto de React que proporciona funcionalidades de autenticación y gestión de sesión a través de Supabase Auth.

## 🔧 Props

```typescript
interface AuthContextProps {
  supabase: SupabaseClient;
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}
```

## 🎨 Estilos

- Estados de carga
- Estados de error
- Feedback visual
- Mensajes de estado

## 📊 Estado

- Estado de autenticación
- Estado de sesión
- Estado de carga
- Manejo de errores

## 🔄 Funcionalidades

1. **Autenticación**
   - Inicio de sesión
   - Registro
   - Cierre de sesión
   - Recuperación de contraseña

2. **Gestión de Sesión**
   - Verificación de sesión
   - Estado de usuario
   - Manejo de tokens

3. **Seguridad**
   - Validación de datos
   - Manejo de errores
   - Protección contra CSRF

## 🔗 Dependencias

### Consumidores

- `App`: Componente principal
- `PrivateRoute`: Rutas protegidas
- `LoginForm`: Formulario de inicio de sesión

### Dependencias

1. **Librerías**
   - `Supabase`: Autenticación
   - `React Router DOM`: Navegación
   - `Lucide Icons`: Iconos

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

### 2. Registro

#### Criterios de Éxito
- ✅ Validación de datos
- ✅ Creación de usuario
- ✅ Inicio de sesión automático
- ✅ Sesión activa

#### Criterios de Fallo
- ❌ Datos inválidos
- ❌ Email existente
- ❌ Error de conexión
- ❌ Sesión expirada

### 3. Cierre de Sesión

#### Criterios de Éxito
- ✅ Cierre de sesión
- ✅ Redirección al login
- ✅ Sesión cerrada
- ✅ Estado actualizado

#### Criterios de Fallo
- ❌ Error en cierre
- ❌ Sesión no encontrada
- ❌ Error de conexión

### 4. Recuperación de Contraseña

#### Criterios de Éxito
- ✅ Envío de email
- ✅ Mensaje de éxito
- ✅ Estado actualizado
- ✅ Redirección

#### Criterios de Fallo
- ❌ Email no encontrado
- ❌ Error de envío
- ❌ Error de conexión

## 🛠️ Contextos

- Gestiona el estado global de autenticación
- Se integra con Supabase Auth
- Proporciona utilidades de autenticación

## 🐛 Consideraciones

- Validación de datos
- Manejo de estados
- Gestión de errores
- Seguridad en datos
- Protección contra CSRF
