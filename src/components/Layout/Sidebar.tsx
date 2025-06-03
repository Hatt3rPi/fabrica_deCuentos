import React, { useState, useEffect } from 'react';
import { BookOpen, User, Settings, LogOut, AlertTriangle, BarChart3, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAdmin } from '../../context/AdminContext';
import { Link } from 'react-router-dom';
import { ImageGenerationSettings, ImageEngine, OpenAIModel, StabilityModel } from '../../types';

const Sidebar: React.FC = () => {
  const { signOut, supabase } = useAuth();
  const isAdmin = useAdmin();
  const [settings, setSettings] = useState<ImageGenerationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
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

    loadSettings();
  }, [supabase, isAdmin]);

  const handleEngineChange = async (
    type: 'thumbnail' | 'variations' | 'spriteSheet',
    provider: 'openai' | 'stability',
    model: OpenAIModel | StabilityModel,
    quality?: string,
    size?: string,
    style?: string
  ) => {
    if (!isAdmin || !settings) return;
    setIsLoading(true);

    const updatedEngine: ImageEngine = {
      provider,
      model,
      ...(quality && { quality }),
      ...(size && { size }),
      ...(style && { style })
    };

    try {
      const updatedSettings: ImageGenerationSettings = {
        ...settings,
        engines: {
          ...settings.engines,
          [type]: updatedEngine
        },
        last_updated: new Date().toISOString()
      };

      const { error } = await supabase
        .from('system_settings')
        .update({
          value: updatedSettings
        })
        .eq('key', 'image_generation');

      if (error) throw error;

      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderEngineSelector = (
    type: 'thumbnail' | 'variations' | 'spriteSheet',
    label: string
  ) => {
    const engine = settings?.engines[type];
    
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <select
          value={`${engine?.provider}:${engine?.model}`}
          onChange={(e) => {
            const [provider, model] = e.target.value.split(':');
            handleEngineChange(
              type,
              provider as 'openai' | 'stability',
              model as OpenAIModel | StabilityModel
            );
          }}
          disabled={isLoading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <optgroup label="OpenAI">
            <option value="openai:dall-e-2">DALL-E 2</option>
            <option value="openai:dall-e-3">DALL-E 3</option>
            <option value="openai:gpt-image-1">GPT-4 Vision</option>
          </optgroup>
          <optgroup label="Stability AI">
            <option value="stability:stable-diffusion-3.5">Stable Diffusion 3.5</option>
          </optgroup>
        </select>

        {engine?.provider === 'openai' && engine.model === 'dall-e-3' && (
          <>
            <select
              value={engine.quality || 'standard'}
              onChange={(e) => handleEngineChange(
                type,
                engine.provider,
                engine.model,
                e.target.value,
                engine.size,
                engine.style
              )}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mt-2"
            >
              <option value="standard">Calidad Estándar</option>
              <option value="hd">Calidad HD</option>
            </select>

            <select
              value={engine.style || 'vivid'}
              onChange={(e) => handleEngineChange(
                type,
                engine.provider,
                engine.model,
                engine.quality,
                engine.size,
                e.target.value
              )}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mt-2"
            >
              <option value="vivid">Estilo Vívido</option>
              <option value="natural">Estilo Natural</option>
            </select>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Logo section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-purple-600" />
          <span className="font-semibold text-gray-900">CuenterIA</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <Link to="/home" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-purple-50 rounded-lg dark:text-gray-300 dark:hover:bg-purple-900/20">
              <Home className="w-5 h-5" />
              <span>Mis Cuentos</span>
            </Link>
          </li>
          <li>
            <Link to="/perfil" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-purple-50 rounded-lg dark:text-gray-300 dark:hover:bg-purple-900/20">
              <User className="w-5 h-5" />
              <span>Mi Perfil</span>
            </Link>
          </li>
          {isAdmin && (
            <li>
              <Link to="/admin/prompts" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-purple-50 rounded-lg dark:text-gray-300 dark:hover:bg-purple-900/20">
                <Settings className="w-5 h-5" />
                <span>Prompts</span>
              </Link>
            </li>
          )}
          {isAdmin && (
            <li>
              <Link to="/admin/analytics" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-purple-50 rounded-lg dark:text-gray-300 dark:hover:bg-purple-900/20">
                <BarChart3 className="w-5 h-5" />
                <span>Analytics</span>
              </Link>
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
