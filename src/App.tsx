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

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function AppContent() {
  const { user } = useAuth();

  if (!user) {
    return <LoginForm />;
  }

  return (
    <WizardProvider>
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 flex flex-col lg:flex-row">
        {/* Sidebar - Hidden on mobile, visible from lg breakpoint */}
        <div className="hidden lg:block lg:w-60 lg:flex-shrink-0 bg-white border-r border-gray-200">
          <Sidebar />
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<MyStories />} />
              <Route path="/wizard/*" element={<Wizard />} />
            </Routes>
          </main>
          <footer className="py-4 text-center text-purple-600 text-sm">
            <p>Fábrica de Sueños © {new Date().getFullYear()}</p>
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
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <AppContent />
              </PrivateRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;