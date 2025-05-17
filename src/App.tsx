import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WizardProvider } from './context/WizardContext';
import { useAuth } from './context/AuthContext';
import Wizard from './components/Wizard/Wizard';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import LoginForm from './components/Auth/LoginForm';
import MyStories from './pages/MyStories';
import CharacterForm from './components/Character/CharacterForm';
import CharactersGrid from './components/Character/CharactersGrid';

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
                path="/wizard/:storyId/characters/new"
                element={
                  <PrivateRoute>
                    <Wizard initialStep="characters-new" />
                  </PrivateRoute>
                }
              />
              <Route
                path="/wizard/:storyId/characters/:characterId/edit"
                element={
                  <PrivateRoute>
                    <Wizard initialStep="characters-edit" />
                  </PrivateRoute>
                }
              />
              <Route
                path="/wizard/:storyId/story"
                element={
                  <PrivateRoute>
                    <Wizard initialStep="story" />
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
            </Routes>
          </main>
          <footer className="py-4 text-center text-purple-600 text-sm">
            <p>Customware © {new Date().getFullYear()}</p>
          </footer>
        </div>
      </div>
    </WizardProvider>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;