import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminProvider } from './context/AdminContext';
import { WizardProvider } from './context/WizardContext';
import { useAuth } from './context/AuthContext';
import Wizard from './components/Wizard/Wizard';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import LoginForm from './components/Auth/LoginForm';
import MyStories from './pages/MyStories';
import CharacterForm from './components/Character/CharacterForm';
import CharactersGrid from './components/Character/CharactersGrid';
import NotificationBell from './components/Notifications/NotificationBell';
import ToastContainer from './components/UI/ToastContainer';
import ProfileSettings from './pages/ProfileSettings';
import PromptManager from './pages/Admin/PromptManager';
import PromptAnalytics from './pages/Admin/Analytics/PromptAnalytics';
import { useProfileStore } from './stores/profileStore';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/" replace />;
}

function AppContent() {
  const { user } = useAuth();

  if (!user) {
    
    return <LoginForm />;
  }

  return (
    <WizardProvider>
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 flex flex-col lg:flex-row">
        <div className="hidden lg:block lg:w-60 lg:flex-shrink-0 bg-white border-r border-gray-200">
          <Sidebar />
        </div>

        <div className="flex-1 flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow p-4 md:p-6 lg:p-8">
            <Routes>
              <Route path="/" element={user ? <Navigate to="/home" replace /> : <LoginForm />} />
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
                    <PromptManager />
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
            </Routes>
          </main>
          <footer className="py-4 text-center text-purple-600 text-sm">
            <p>Customware © {new Date().getFullYear()}</p>
          </footer>
        </div>
      </div>
      <ToastContainer />
    </WizardProvider>
  );
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
  
  React.useEffect(() => {
    const profileStore = useProfileStore.getState();
    if (profileStore.profile?.theme_preference === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <Router>
      <AuthProvider>
        <AdminProvider>
          <AppContent />
        </AdminProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
