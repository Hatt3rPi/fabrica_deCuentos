import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  
  const handleThemeToggle = async () => {
    await toggleTheme();
  };
  
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Preferencia de Tema</h3>
      
      <div className="flex items-center gap-3">
        <button
          onClick={handleThemeToggle}
          className={`p-2 rounded-full transition-colors ${
            !isDarkMode 
              ? 'bg-purple-100 text-purple-600' 
              : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
          }`}
          aria-label="Modo claro"
        >
          <Sun className="h-5 w-5" />
        </button>
        
        <div className="w-14 h-7 flex items-center bg-gray-300 dark:bg-gray-600 rounded-full p-1 cursor-pointer"
          onClick={handleThemeToggle}>
          <div className={`bg-white dark:bg-gray-800 h-5 w-5 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
            isDarkMode ? 'translate-x-7' : ''
          }`} />
        </div>
        
        <button
          onClick={handleThemeToggle}
          className={`p-2 rounded-full transition-colors ${
            isDarkMode 
              ? 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300' 
              : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
          }`}
          aria-label="Modo oscuro"
        >
          <Moon className="h-5 w-5" />
        </button>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
        {isDarkMode 
          ? 'Modo oscuro activado. Ideal para uso nocturno y reducir la fatiga visual.' 
          : 'Modo claro activado. Mejor visibilidad en ambientes luminosos.'}
      </p>
    </div>
  );
};

export default ThemeToggle;
