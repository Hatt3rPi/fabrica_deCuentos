import React from 'react';
import { BookOpen, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Header: React.FC = () => {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-md py-4 px-4 md:px-6">
      <div className="flex items-center justify-between">
        {/* Mobile menu button - Only visible on mobile */}
        <button className="lg:hidden p-2 hover:bg-purple-50 rounded-lg">
          <Menu className="w-6 h-6 text-purple-600" />
        </button>

        {/* Logo and title */}
        <div className="flex items-center gap-2">
          <BookOpen className="w-8 h-8 text-purple-600" />
          <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
            Fábrica de Cuentos
          </h1>
        </div>

        {/* User info - Hidden on mobile */}
        <div className="hidden md:flex items-center gap-4">
          <span className="text-sm font-medium text-gray-500">
            {user?.email}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;