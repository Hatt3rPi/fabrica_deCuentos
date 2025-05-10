import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { WizardProvider } from './context/WizardContext';
import { useAuth } from './context/AuthContext';
import Wizard from './components/Wizard/Wizard';
import Header from './components/Layout/Header';
import LoginForm from './components/Auth/LoginForm';

function AppContent() {
  const { user } = useAuth();

  if (!user) {
    return <LoginForm />;
  }

  return (
    <WizardProvider>
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 flex flex-col">
        <Header />
        <main className="flex-grow flex flex-col items-center justify-center p-4">
          <Wizard />
        </main>
        <footer className="py-4 text-center text-purple-600 text-sm">
          <p>Fábrica de Sueños © {new Date().getFullYear()}</p>
        </footer>
      </div>
    </WizardProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;