import React, { useState } from 'react';
import { BookOpen, Menu, X, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../Notifications/NotificationBell';

const Header: React.FC = () => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="bg-white shadow-md py-4 px-4 md:px-6 dark:bg-gray-800 dark:text-white">
      <div className="flex items-center justify-between">
        {/* Mobile menu button - Only visible on mobile */}
        <button 
          className="lg:hidden p-2 hover:bg-purple-50 rounded-lg dark:hover:bg-purple-900/20"
          onClick={toggleMobileMenu}
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          ) : (
            <Menu className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          )}
        </button>

        {/* Logo and title */}
        <div className="flex items-center gap-2">
          <BookOpen className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
            La CuenterIA
          </h1>
        </div>

        {/* User info and notifications */}
        <div className="flex items-center gap-4">
          <NotificationBell />
          <span className="hidden md:inline text-sm font-medium text-gray-500 dark:text-gray-300">
            {user?.email}
          </span>
        </div>
      </div>

      {/* Mobile menu drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700">
          <nav>
            <ul className="space-y-2">
              <li>
                <a 
                  href="/perfil" 
                  className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-purple-50 rounded-lg dark:text-gray-300 dark:hover:bg-purple-900/20"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="w-5 h-5" />
                  <span>Mi Perfil</span>
                </a>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
