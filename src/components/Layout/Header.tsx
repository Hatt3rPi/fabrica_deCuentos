import React from 'react';
import { BookOpen } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-md py-4">
      <div className="container mx-auto flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-8 h-8 text-purple-600" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
            Fábrica de Sueños
          </h1>
        </div>
        <div className="hidden md:flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-500">
            Crea cuentos mágicos personalizados
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;