import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminProvider } from './context/AdminContext';
import { WizardProvider } from './context/WizardContext';
import { useAuth } from './context/AuthContext';
import Wizard from './components/Wizard/Wizard';
import LoginForm from './components/Auth/LoginForm';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import MyStories from './pages/MyStories';
import CharacterForm from './components/Character/CharacterForm';
import CharactersGrid from './components/Character/CharactersGrid';
import ToastContainer from './components/UI/ToastContainer';
import ProfileSettings from './pages/ProfileSettings';
import PromptsManager from './pages/Admin/Prompts/PromptsManager';
import PromptAnalytics from './pages/Admin/Analytics/PromptAnalytics';
import { ThemeProvider } from './context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from './components/Layout/MainLayout';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/" replace />;
}

function AnimatedRoutes() {
  const location = useLocation();
  const { user, loading } = useAuth();
  const isAuthTransition = location.pathname === '/login' || location.pathname === '/' || location.pathname === '/home';

  // Mostrar estado de carga solo si estamos cargando y no es una ruta pública
  if (loading && !['/', '/login'].includes(location.pathname)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Si no hay usuario y no estamos en una ruta pública, redirigir al login
  if (!user && !['/', '/login'].includes(location.pathname)) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Rutas públicas
  if (!user) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={isAuthTransition ? undefined : { opacity: 0, x: 100 }}
          animate={isAuthTransition ? undefined : { opacity: 1, x: 0 }}
          exit={isAuthTransition ? undefined : { opacity: 0, x: -100 }}
          transition={isAuthTransition ? { duration: 0 } : { duration: 0.3, ease: 'easeInOut' }}
          className="w-full h-full"
        >
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Rutas protegidas (usuario autenticado)
  return (
    <WizardProvider>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={isAuthTransition ? undefined : { opacity: 0, x: 100 }}
          animate={isAuthTransition ? undefined : { opacity: 1, x: 0 }}
          exit={isAuthTransition ? undefined : { opacity: 0, x: -100 }}
          transition={isAuthTransition ? { duration: 0 } : { duration: 0.3, ease: 'easeInOut' }}
          className="w-full h-full"
        >
          <MainLayout>
            <Routes location={location} key={location.pathname}>
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <HomePage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/wizard/:storyId"
                element={
                  <PrivateRoute>
                    <Wizard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/nuevo-cuento/personajes"
                element={
                  <PrivateRoute>
                    <CharactersGrid />
                  </PrivateRoute>
                }
              />
              <Route
                path="/nuevo-cuento/personaje/nuevo"
                element={
                  <PrivateRoute>
                    <CharacterForm />
                  </PrivateRoute>
                }
              />
              <Route
                path="/nuevo-cuento/personaje/:id/editar"
                element={
                  <PrivateRoute>
                    <CharacterForm />
                  </PrivateRoute>
                }
              />
              <Route
                path="/home"
                element={
                  <PrivateRoute>
                    <MyStories />
                  </PrivateRoute>
                }
              />
              <Route
                path="/perfil"
                element={
                  <PrivateRoute>
                    <ProfileSettings />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/prompts"
                element={
                  <PrivateRoute>
                    <PromptsManager />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <PrivateRoute>
                    <PromptAnalytics />
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </MainLayout>
        </motion.div>
      </AnimatePresence>
    </WizardProvider>
  );
}

function AppContent() {
  // El contenido de la aplicación ahora está manejado por AnimatedRoutes
  return <AnimatedRoutes />;
}

// Registrar el service worker para las notificaciones
const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('Service Worker registrado con éxito:', registration.scope);
        })
        .catch(error => {
          console.log('Error al registrar el Service Worker:', error);
        });
    });
  }
};

function App() {
  // Registrar el service worker al cargar la aplicación
  React.useEffect(() => {
    registerServiceWorker();
  }, []);
  
  // Add ToastContainer to the root of the app
  const toastContainer = <ToastContainer />;

  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AdminProvider>
            <AppContent />
            {toastContainer}
          </AdminProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
