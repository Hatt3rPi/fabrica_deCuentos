import React from 'react';
import { BookOpen, User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar: React.FC = () => {
  const { signOut } = useAuth();

  return (
    <div className="h-full flex flex-col">
      {/* Logo section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-purple-600" />
          <span className="font-semibold text-gray-900">Fábrica</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <a href="#" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-purple-50 rounded-lg">
              <User className="w-5 h-5" />
              <span>Mi Perfil</span>
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-purple-50 rounded-lg">
              <Settings className="w-5 h-5" />
              <span>Configuración</span>
            </a>
          </li>
        </ul>
      </nav>

      {/* Footer actions */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-purple-50 rounded-lg"
        >
          <LogOut className="w-5 h-5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;