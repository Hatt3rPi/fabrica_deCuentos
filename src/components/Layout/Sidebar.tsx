import React, { useState, useEffect } from 'react';
import { BookOpen, User, Settings, LogOut, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ImageGenerationSettings } from '../../types';

const Sidebar: React.FC = () => {
  const { signOut, user, supabase } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [settings, setSettings] = useState<ImageGenerationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkAdminStatus = () => {
      setIsAdmin(user?.email === 'fabarca212@gmail.com');
    };

    const loadSettings = async () => {
      if (!isAdmin) return;
      
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'image_generation')
          .single();

        if (error) throw error;
        setSettings(data.value as ImageGenerationSettings);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    checkAdminStatus();
    loadSettings();
  }, [user, supabase, isAdmin]);

  const handleEngineChange = async (engine: 'openai' | 'stable_diffusion') => {
    if (!isAdmin) return;
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('system_settings')
        .update({
          value: {
            ...settings,
            engine,
            last_updated: new Date().toISOString()
          }
        })
        .eq('key', 'image_generation');

      if (error) throw error;

      setSettings(prev => prev ? {
        ...prev,
        engine,
        last_updated: new Date().toISOString()
      } : null);
    } catch (error) {
      console.error('Error updating settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
          {isAdmin && (
            <li className="mt-4">
              <div className="px-4 py-2">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Configuración del Sistema</h3>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-800">
                      ⚠️ ATENCIÓN: Su selección afectará el método de generación de imágenes para TODOS los usuarios del sistema
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Motor de generación
                  </label>
                  <select
                    value={settings?.engine || 'openai'}
                    onChange={(e) => handleEngineChange(e.target.value as 'openai' | 'stable_diffusion')}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="openai">OpenAI DALL-E 3</option>
                    <option value="stable_diffusion">Stable Diffusion 3.5</option>
                  </select>
                </div>

                {settings && (
                  <p className="mt-2 text-xs text-gray-500">
                    Última actualización: {new Date(settings.last_updated).toLocaleString()}
                  </p>
                )}
              </div>
            </li>
          )}
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