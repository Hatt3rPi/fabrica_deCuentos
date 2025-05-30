import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminProvider } from './context/AdminContext';
import { WizardProvider } from './context/WizardContext';
import { useAuth } from './context/AuthContext';
import Wizard from './components/Wizard/Wizard';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import LoginForm from './components/Auth/LoginForm';
import LandingPage from './pages/LandingPage';
import MyStories from './pages/MyStories';
import CharacterForm from './components/Character/CharacterForm';
import CharactersGrid from './components/Character/CharactersGrid';
import ToastContainer from './components/UI/ToastContainer';
import ProfileSettings from './pages/ProfileSettings';
import PromptsManager from './pages/Admin/Prompts/PromptsManager';
import PromptAnalytics from './pages/Admin/Analytics/PromptAnalytics';
import { useProfileStore } from './stores/profileStore';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/" replace />;
}

function AnimatedRoutes() {
  const location = useLocation();
  const { user } = useAuth();
  const isAuthTransition = location.pathname === '/login' || location.pathname === '/' || location.pathname === '/home';

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

  return (
    <WizardProvider>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={isAuthTransition ? undefined : { opacity: 0, x: 100 }}
          animate={isAuthTransition ? undefined : { opacity: 1, x: 0 }}
          exit={isAuthTransition ? undefined : { opacity: 0, x: -100 }}
          transition={isAuthTransition ? { duration: 0 } : { duration: 0.3, ease: 'easeInOut' }}
          className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 dark:bg-gray-900 dark:text-white flex flex-col lg:flex-row"
        >
          <div className="hidden lg:block lg:w-60 lg:flex-shrink-0 bg-white border-r border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <Sidebar />
          </div>

          <div className="flex-1 flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow p-4 md:p-6 lg:p-8">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Navigate to="/home" replace />} />
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
            </main>
            <footer className="py-4 text-center text-purple-600 dark:text-purple-400 text-sm">
              <p>Customware © {new Date().getFullYear()}</p>
            </footer>
          </div>
          <ToastContainer />
        </motion.div>
      </AnimatePresence>
    </WizardProvider>
  );
}

function AppContent() {
  // El contenido de la aplicación ahora está manejado por AnimatedRoutes
  return <AnimatedRoutes />;
}

const ThemeInitializer: React.FC = () => {
  const { setTheme } = useTheme();

  React.useEffect(() => {
    const profileStore = useProfileStore.getState();
    if (profileStore.profile?.theme_preference) {
      setTheme(profileStore.profile.theme_preference);
    }
  }, [setTheme]);

  return null;
};

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

  return (
    <Router>
      <ThemeProvider>
        <ThemeInitializer />
        <AuthProvider>
          <AdminProvider>
            <AppContent />
          </AdminProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
