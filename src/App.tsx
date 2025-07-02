import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminProvider } from './context/AdminContext';
import { UserRoleProvider } from './context/UserRoleContext';
import { WizardProvider } from './context/WizardContext';
import { StoryProvider } from './context/StoryContext';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './contexts/CartContext';
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
import AdminStyleEditor from './pages/Admin/StyleEditor/AdminStyleEditor';
import AdminPedidos from './pages/Admin/Pedidos';
import AdminUsers from './pages/Admin/Users';
import PriceManager from './components/Admin/PriceManager';
import AdminDebug from './pages/Admin/AdminDebug';
import Unauthorized from './pages/Unauthorized';
import MyPurchases from './pages/MyPurchases';
import { motion, AnimatePresence } from 'framer-motion';
import DevelopmentBanner from './components/Dev/DevelopmentBanner';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/" replace />;
}

function AnimatedRoutes() {
  const location = useLocation();
  const { user } = useAuth();

  // Single AnimatePresence for consistent navigation animations
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${user ? 'authenticated' : 'unauthenticated'}-${location.pathname}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="w-full h-full"
      >
        <DevelopmentBanner />
        {!user ? (
          // Unauthenticated layout
          <Routes location={location}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        ) : (
          // Authenticated layout
          <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex">
            {/* Sidebar fijo en desktop */}
            <div className="hidden lg:block flex-shrink-0 w-64 h-screen sticky top-0 overflow-y-auto">
              <Sidebar />
            </div>

            {/* Contenido principal */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
              <Header className="sticky top-0 z-10" />
              <main className="flex-grow p-4 md:p-6 lg:p-8">
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
                    path="/my-purchases"
                    element={
                      <PrivateRoute>
                        <MyPurchases />
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
                  <Route
                    path="/admin/style"
                    element={
                      <PrivateRoute>
                        <AdminStyleEditor />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/admin/pedidos"
                    element={
                      <PrivateRoute>
                        <AdminPedidos />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/admin/users"
                    element={
                      <PrivateRoute>
                        <AdminUsers />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/admin/precios"
                    element={
                      <PrivateRoute>
                        <PriceManager />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/admin/debug"
                    element={
                      <PrivateRoute>
                        <AdminDebug />
                      </PrivateRoute>
                    }
                  />
                  <Route path="/unauthorized" element={<Unauthorized />} />
                  <Route path="*" element={<Navigate to="/home" replace />} />
                </Routes>
              </main>
              <footer className="py-4 text-center text-purple-600 dark:text-purple-400 text-sm">
                <p>Customware © {new Date().getFullYear()}</p>
              </footer>
            </div>
            <ToastContainer />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
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
        <UserRoleProvider>
          <ThemeProvider>
            <AdminProvider>
              <CartProvider>
                <AppContent />
              </CartProvider>
            </AdminProvider>
          </ThemeProvider>
        </UserRoleProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
