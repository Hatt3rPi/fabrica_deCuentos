import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminProvider } from './context/AdminContext';
import { WizardProvider } from './context/WizardContext';
import { StoryProvider } from './context/StoryContext';
import { ThemeProvider } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';
import StoryCreationWizard from './pages/StoryCreationWizard';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import LoginForm from './components/Auth/LoginForm';
import LandingPage from './pages/LandingPage';
import MyStories from './pages/MyStories';
import StoryReader from './pages/StoryReader';
import CharacterForm from './components/Character/CharacterForm';
import CharactersGrid from './components/Character/CharactersGrid';
import ToastContainer from './components/UI/ToastContainer';
import ProfileSettings from './pages/ProfileSettings';
import PromptsManager from './pages/Admin/Prompts/PromptsManager';
import PromptAnalytics from './pages/Admin/Analytics/PromptAnalytics';
import AdminFlujo from './pages/Admin/Flujo';
import { motion, AnimatePresence } from 'framer-motion';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/" replace />;
}

function AnimatedRoutes() {
  const location = useLocation();
  const { user } = useAuth();

  if (!user) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="w-full h-full"
        >
          <Routes location={location}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex flex-col lg:flex-row">
      <div className="hidden lg:block lg:w-60 lg:flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow p-4 md:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="h-full"
            >
              <Routes location={location}>
                <Route path="/" element={<Navigate to="/home" replace />} />
                <Route
                  path="/wizard/:storyId"
                  element={
                    <PrivateRoute>
                      <StoryProvider>
                        <WizardProvider>
                          <StoryCreationWizard />
                        </WizardProvider>
                      </StoryProvider>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/nuevo-cuento/personajes"
                  element={
                    <PrivateRoute>
                      <StoryProvider>
                        <CharactersGrid />
                      </StoryProvider>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/nuevo-cuento/personaje/nuevo"
                  element={
                    <PrivateRoute>
                      <StoryProvider>
                        <CharacterForm />
                      </StoryProvider>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/nuevo-cuento/personaje/:id/editar"
                  element={
                    <PrivateRoute>
                      <StoryProvider>
                        <CharacterForm />
                      </StoryProvider>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/home"
                  element={
                    <PrivateRoute>
                      <StoryProvider>
                        <MyStories />
                      </StoryProvider>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/story/:id/read"
                  element={
                    <PrivateRoute>
                      <StoryReader />
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
                <Route
                  path="/admin/flujo"
                  element={
                    <PrivateRoute>
                      <AdminFlujo />
                    </PrivateRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/home" replace />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
        <footer className="py-4 text-center text-purple-600 dark:text-purple-400 text-sm">
          <p>Customware © {new Date().getFullYear()}</p>
        </footer>
      </div>
      <ToastContainer />
    </div>
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

  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <AdminProvider>
            <AppContent />
          </AdminProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
